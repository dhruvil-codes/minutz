import json
import os
import shutil
import traceback
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import openai
from supabase import create_client

from niche_prompts import BASE_KEYS, NICHE_SPECIFIC_KEYS, PROMPTS

load_dotenv()


def safe_first(rows):
    """Safely get the first item from a Supabase join result (list or dict)."""
    if not rows:
        return None
    if isinstance(rows, list):
        return rows[0] if len(rows) > 0 else None
    if isinstance(rows, dict):
        return rows
    return None


app = FastAPI(title="Minutz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("D:/minutz/backend/temp")

openai_client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    max_retries=3,
    timeout=300.0,
)
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

MAX_WHISPER_BYTES = 24 * 1024 * 1024
OVERLAP_MS = 30_000  # 30 second overlap between Whisper chunks


def estimate_processing_cost(duration_seconds: float, transcript_tokens: int) -> dict:
    whisper_cost = (duration_seconds / 60) * 0.006
    if transcript_tokens <= 12_000:
        gpt4o_cost = (transcript_tokens / 1000) * 0.015
        gpt4o_mini_cost = 0.0
    elif transcript_tokens <= 40_000:
        # MapReduce: segments with mini, final merge with 4o
        segments = max(1, transcript_tokens // 4000)
        gpt4o_mini_cost = (transcript_tokens / 1000) * 0.00015
        gpt4o_cost = (min(transcript_tokens, 8000) / 1000) * 0.015
    else:
        # All segments with mini, only final merge with 4o
        gpt4o_mini_cost = (transcript_tokens / 1000) * 0.00015
        gpt4o_cost = (8000 / 1000) * 0.015
    total = whisper_cost + gpt4o_cost + gpt4o_mini_cost
    return {
        "whisper_usd": round(whisper_cost, 4),
        "gpt4o_usd": round(gpt4o_cost, 4),
        "gpt4o_mini_usd": round(gpt4o_mini_cost, 4),
        "total_usd": round(total, 4),
        "duration_seconds": round(duration_seconds, 1),
        "transcript_tokens": transcript_tokens,
    }


def _count_tokens(text: str) -> int:
    # ~4 chars per token is a reliable approximation without tiktoken
    return len(text) // 4


def _transcribe_file(path: Path) -> str:
    with open(path, "rb") as f:
        return openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language="en",
            response_format="text",
        )


def _merge_overlap(a: str, b: str) -> str:
    """Remove duplicated sentences at the seam between two transcript chunks."""
    a_sentences = [s.strip() for s in a.split(".") if s.strip()]
    b_sentences = [s.strip() for s in b.split(".") if s.strip()]
    tail = a_sentences[-6:] if len(a_sentences) >= 6 else a_sentences
    for i, sent in enumerate(b_sentences):
        if sent in tail:
            b_sentences = b_sentences[i + 1:]
            break
    return a.rstrip() + " " + ". ".join(b_sentences) + ("." if b_sentences else "")


def _call_gpt(system_prompt: str, transcript: str, model: str = "gpt-4o") -> dict[str, Any]:
    response = openai_client.chat.completions.create(
        model=model,
        temperature=0.1,
        max_tokens=2000,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Transcript:\n{transcript}"},
        ],
    )
    return json.loads(response.choices[0].message.content)


def _merge_summaries(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    for key in set(a) | set(b):
        av, bv = a.get(key), b.get(key)
        if isinstance(av, list) and isinstance(bv, list):
            seen = []
            for item in av + bv:
                if item not in seen:
                    seen.append(item)
            merged[key] = seen
        elif isinstance(av, str) and isinstance(bv, str):
            merged[key] = f"{av} {bv}".strip() if key == "executive_summary" else av
        else:
            merged[key] = av if av is not None else bv
    return merged


@app.on_event("startup")
async def startup_log():
    key = os.getenv("OPENAI_API_KEY", "")
    url = os.getenv("SUPABASE_URL", "")
    print(f"[startup] OPENAI_API_KEY: {key[:8]}... | SUPABASE_URL: {url}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/upload-chunk")
async def upload_chunk(
    session_id: str = Form(...),
    chunk_index: int = Form(...),
    audio: UploadFile = File(...),
):
    session_dir = TEMP_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(audio.filename).suffix if audio.filename else ".webm"
    chunk_path = session_dir / f"chunk_{chunk_index}{ext}"
    try:
        content = await audio.read()
        chunk_path.write_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chunk: {e}")

    return {"received": True, "chunk": chunk_index}


class FinalizeBody(BaseModel):
    niche: str
    title: str


@app.post("/finalize/{session_id}")
async def finalize(session_id: str, body: FinalizeBody):
    try:
        session_dir = TEMP_DIR / session_id

        print(f"[finalize] temp folder: {session_dir}")
        if session_dir.exists():
            print(f"[finalize] files: {[f.name for f in session_dir.iterdir()]}")
        else:
            print("[finalize] session folder does not exist")
        print(f"[finalize] ffmpeg: {shutil.which('ffmpeg')}")

        if not session_dir.exists():
            raise HTTPException(status_code=404, detail="Session not found")

        chunks = sorted(
            [p for p in session_dir.glob("chunk_*") if p.suffix],
            key=lambda p: int(p.stem.split("_")[1]),
        )
        if not chunks:
            raise HTTPException(status_code=400, detail="No chunks found for session")

        # --- Step 1: Concatenate and compress to mono 16kHz MP3 @ 64k ---
        try:
            from pydub import AudioSegment

            # Concatenate raw bytes first — only chunk_0 has the webm EBML header,
            # subsequent chunks are continuation data and can't be opened individually.
            print(f"[finalize] concatenating {len(chunks)} chunks as raw bytes")
            combined_bytes = b""
            for chunk_path in chunks:
                combined_bytes += chunk_path.read_bytes()

            combined_webm = session_dir / "combined.webm"
            combined_webm.write_bytes(combined_bytes)
            print(f"[finalize] combined webm size={len(combined_bytes) / 1024:.1f} KB")

            combined = AudioSegment.from_file(str(combined_webm), format="webm")
            duration_seconds = len(combined) / 1000
            print(f"[finalize] total duration={duration_seconds:.1f}s")

            compressed = combined.set_channels(1).set_frame_rate(16000)
            mp3_path = session_dir / "full.mp3"
            print(f"[finalize] exporting compressed MP3 to {mp3_path}")
            compressed.export(str(mp3_path), format="mp3", bitrate="64k")
            mp3_size = mp3_path.stat().st_size
            print(f"[finalize] MP3 size={mp3_size / 1024 / 1024:.1f} MB")
        except HTTPException:
            raise
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Audio processing failed: {e}")

        # --- Step 2: Transcribe (with overlap-aware chunking if > 24 MB) ---
        try:
            print("[finalize] starting transcription")
            if mp3_size <= MAX_WHISPER_BYTES:
                transcript_text = _transcribe_file(mp3_path)
                print(f"[finalize] single-pass transcription done, len={len(transcript_text)}")
            else:
                from pydub import AudioSegment as _AS
                audio_full = _AS.from_file(str(mp3_path), format="mp3")
                ms_per_byte = len(audio_full) / mp3_size
                segment_ms = int(MAX_WHISPER_BYTES * ms_per_byte)

                parts: list[str] = []
                start = 0
                part_idx = 0
                while start < len(audio_full):
                    # Include overlap from previous boundary (except first chunk)
                    slice_start = max(0, start - OVERLAP_MS) if part_idx > 0 else 0
                    part = audio_full[slice_start: start + segment_ms]
                    part_path = session_dir / f"part_{part_idx}.mp3"
                    part.export(str(part_path), format="mp3", bitrate="64k")
                    part_size = part_path.stat().st_size
                    print(f"[finalize] transcribing part {part_idx}, size={part_size / 1024 / 1024:.1f} MB")
                    raw = _transcribe_file(part_path)
                    parts.append(raw)
                    start += segment_ms
                    part_idx += 1

                # Merge parts, deduplicating at overlap seams
                transcript_text = parts[0]
                for nxt in parts[1:]:
                    transcript_text = _merge_overlap(transcript_text, nxt)
                print(f"[finalize] multi-part transcription done, len={len(transcript_text)}")
        except HTTPException:
            raise
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")

        # --- Step 3: Cost estimate ---
        token_count = _count_tokens(transcript_text)
        cost = estimate_processing_cost(duration_seconds, token_count)
        print(
            f"[cost] Whisper: ${cost['whisper_usd']} | "
            f"GPT-4o: ${cost['gpt4o_usd']} | "
            f"GPT-4o-mini: ${cost['gpt4o_mini_usd']} | "
            f"Total: ${cost['total_usd']}"
        )

        # --- Step 4: Save to Supabase ---
        try:
            meeting_id = str(uuid.uuid4())
            print(f"[finalize] saving meeting_id={meeting_id}")

            supabase.table("meetings").insert({
                "id": meeting_id,
                "niche": body.niche,
                "title": body.title,
                "duration_seconds": int(duration_seconds),
                "metadata": cost,
            }).execute()

            supabase.table("transcripts").insert({
                "meeting_id": meeting_id,
                "raw_text": transcript_text,
            }).execute()
            print("[finalize] Supabase inserts OK")
        except HTTPException:
            raise
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database error: {e}")

        shutil.rmtree(session_dir, ignore_errors=True)

        return {"meeting_id": meeting_id, "transcript": transcript_text, "cost": cost}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class SummarizeBody(BaseModel):
    meeting_id: str
    transcript: str
    niche: str


def _summarize_token_aware(system_prompt: str, transcript: str) -> dict[str, Any]:
    tokens = _count_tokens(transcript)
    print(f"[summarize] transcript tokens ~{tokens}")

    if tokens <= 12_000:
        # Single GPT-4o call
        print("[summarize] strategy: single gpt-4o call")
        return _call_gpt(system_prompt, transcript, model="gpt-4o")

    # Split transcript into ~30-min segments (~4000 tokens each at 64k bitrate)
    segment_chars = 16_000  # ~4000 tokens
    segments = [transcript[i: i + segment_chars] for i in range(0, len(transcript), segment_chars)]
    print(f"[summarize] strategy: mapreduce over {len(segments)} segments")

    if tokens <= 40_000:
        # Segments with mini, final merge with 4o
        segment_model = "gpt-4o-mini"
        merge_model = "gpt-4o"
    else:
        # Everything with mini, final merge with 4o
        segment_model = "gpt-4o-mini"
        merge_model = "gpt-4o"

    partial_summaries = []
    for i, seg in enumerate(segments):
        print(f"[summarize] segment {i} with {segment_model}")
        partial_summaries.append(_call_gpt(system_prompt, seg, model=segment_model))

    merged = partial_summaries[0]
    for s in partial_summaries[1:]:
        merged = _merge_summaries(merged, s)

    # Final synthesis pass with the merge model
    print(f"[summarize] final synthesis with {merge_model}")
    merged_text = json.dumps(merged)
    synthesis_prompt = (
        system_prompt
        + "\n\nYou are given a pre-merged JSON summary from multiple segments. "
        "Clean it up, deduplicate, and return a single coherent JSON summary."
    )
    return _call_gpt(synthesis_prompt, merged_text, model=merge_model)


@app.post("/summarize")
async def summarize(body: SummarizeBody):
    niche = body.niche if body.niche in PROMPTS else "general"

    # Short transcript guard — skip GPT-4o and return sensible defaults
    word_count = len(body.transcript.split())
    if len(body.transcript.strip()) < 50 or word_count < 10:
        print(f"[summarize] transcript too short ({len(body.transcript)} chars, {word_count} words), skipping GPT")
        base_data = {
            "executive_summary": "Recording too short to summarize. Please record at least 30 seconds of speech.",
            "action_items": [],
            "decisions": [],
            "follow_ups": [],
            "sentiment": "neutral",
            "urgency": "low",
        }
        try:
            supabase.table("summaries").upsert({
                "meeting_id": body.meeting_id,
                **base_data,
                "niche_data": {},
            }).execute()
            supabase.table("meetings").update({"status": "completed"}).eq(
                "id", body.meeting_id
            ).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {e}")
        return {**base_data, "niche_data": {}, "meeting_id": body.meeting_id, "short_transcript": True}

    system_prompt = PROMPTS[niche]
    try:
        parsed = _summarize_token_aware(system_prompt, body.transcript)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"GPT returned invalid JSON: {e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"GPT call failed: {e}")

    niche_keys = NICHE_SPECIFIC_KEYS.get(niche, set())
    base_data = {k: parsed.get(k) for k in BASE_KEYS}
    niche_data = {k: parsed.get(k) for k in niche_keys if k in parsed}

    try:
        supabase.table("summaries").upsert({
            "meeting_id": body.meeting_id,
            **base_data,
            "niche_data": niche_data,
        }).execute()

        supabase.table("meetings").update({"status": "completed"}).eq(
            "id", body.meeting_id
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {**base_data, "niche_data": niche_data, "meeting_id": body.meeting_id}


@app.get("/meetings")
async def get_meetings():
    try:
        result = (
            supabase.table("meetings")
            .select("*, summaries(executive_summary)")
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    meetings = []
    for row in result.data:
        summary_rows = row.pop("summaries", None) or []
        preview = None
        if summary_rows:
            summary = None
            if isinstance(summary_rows, list) and len(summary_rows) > 0:
                summary = summary_rows[0]
            elif isinstance(summary_rows, dict):
                summary = summary_rows
            if summary:
                es = summary.get("executive_summary") or ""
                preview = es[:150] if es else None
        meetings.append({**row, "executive_summary_preview": preview})

    return meetings


@app.get("/meeting/{meeting_id}/status")
async def get_meeting_status(meeting_id: str):
    try:
        result = (
            supabase.table("meetings")
            .select("id, status, title, niche")
            .eq("id", meeting_id)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    if not result.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    row = result.data
    return {
        "meeting_id": row["id"],
        "status": row["status"],
        "title": row["title"],
        "niche": row["niche"],
    }


@app.get("/meeting/{meeting_id}")
async def get_meeting(meeting_id: str):
    try:
        result = (
            supabase.table("meetings")
            .select("*, summaries(*), transcripts(raw_text)")
            .eq("id", meeting_id)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    if not result.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    row = result.data

    summary = safe_first(row.pop("summaries", None))
    transcript_row = safe_first(row.pop("transcripts", None))
    transcript = transcript_row.get("raw_text") if transcript_row else None

    return {**row, "summary": summary, "transcript": transcript}


class SlackBody(BaseModel):
    meeting_id: str
    channel_id: Optional[str] = None


@app.post("/send-to-slack")
async def send_to_slack(body: SlackBody):
    bot_token = os.getenv("SLACK_BOT_TOKEN", "").strip()
    channel_id = (body.channel_id or "").strip() or os.getenv("SLACK_CHANNEL_ID", "").strip()
    print(f"[slack] SLACK_BOT_TOKEN: {bot_token[:20] if bot_token else 'NOT SET'}")
    print(f"[slack] SLACK_CHANNEL_ID: {channel_id if channel_id else 'NOT SET'}")
    if not bot_token:
        raise HTTPException(status_code=500, detail="Slack bot token not configured")
    if not channel_id:
        raise HTTPException(status_code=500, detail="Slack channel ID not configured")

    # Fetch meeting + summary
    try:
        result = (
            supabase.table("meetings")
            .select("*, summaries(*)")
            .eq("id", body.meeting_id)
            .maybe_single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    if not result.data:
        raise HTTPException(status_code=404, detail="Meeting not found")

    row = result.data
    summary = safe_first(row.pop("summaries", None)) or {}

    title = row.get("title") or "Untitled Meeting"
    executive_summary = summary.get("executive_summary") or "_No summary available._"
    action_items: list = summary.get("action_items") or []
    decisions: list = summary.get("decisions") or []
    follow_ups: list = summary.get("follow_ups") or []

    def bullet_list(items: list) -> str:
        if not items:
            return "_None_"
        lines = []
        for item in items:
            if isinstance(item, dict):
                task = item.get("task", str(item))
                owner = item.get("owner")
                due = item.get("due_date")
                line = f"• {task}"
                if owner:
                    line += f" _(owner: {owner})_"
                if due:
                    line += f" _(due: {due})_"
                lines.append(line)
            else:
                lines.append(f"• {item}")
        return "\n".join(lines)

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"Meeting Summary: {title}", "emoji": True},
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Executive Summary*\n{executive_summary}"},
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Action Items*\n{bullet_list(action_items)}"},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Key Decisions*\n{bullet_list(decisions)}"},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Follow-ups*\n{bullet_list(follow_ups)}"},
        },
    ]

    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={
                    "Authorization": f"Bearer {bot_token}",
                    "Content-Type": "application/json",
                },
                json={"channel": channel_id, "blocks": blocks},
            )
        data = resp.json()
        if not data.get("ok"):
            raise HTTPException(
                status_code=500,
                detail=f"Slack API error: {data.get('error', 'unknown')}",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Slack request failed: {e}")

    return {"sent": True}
