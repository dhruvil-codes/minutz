# Minutz

AI meeting intelligence tool — Chrome Extension captures meeting audio invisibly, FastAPI backend transcribes with Whisper and summarizes with GPT-4o, Next.js dashboard displays structured intelligence.

## Stack

- Chrome Extension (MV3)
- FastAPI Python backend
- Next.js 14 dashboard
- Supabase PostgreSQL
- OpenAI Whisper + GPT-4o

## Folder Structure

```
/backend     FastAPI backend
/extension   Chrome MV3 extension
/dashboard   Next.js dashboard (not started yet)
```

## Ports

- Backend: **8001** (do not change)
- Dashboard: **3000**

## Environment

- All env vars live in `D:\minutz\backend\.env`
- Always use `python-dotenv` to load them
- Never hardcode API keys

## Supabase

- Project ID: `ffqmyqlszeiqiabnrcxt`

## Niche Modes

4 modes: `general`, `sales`, `pm`, `financial`

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app, all endpoints |
| `backend/niche_prompts.py` | GPT prompts and field definitions per niche |
| `extension/background.js` | Service worker, tab capture, recording orchestration |
| `extension/content.js` | MediaRecorder, chunk upload, finalize/summarize calls |

## Current Status

- Backend: complete
- Extension: built
- Dashboard: not started

## Starting the Backend

```
cd D:\minutz\backend
uvicorn main:app --reload --port 8001
```

Always use `--port 8001`. The previous log (`uvicorn.log`) shows it was accidentally started on 8000 — don't repeat that.

## Rules

- Do not change port 8001
- Do not modify `niche_prompts.py` without being explicitly asked
- Always use `python-dotenv` for environment variables
- Never hardcode API keys
