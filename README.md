# Minutz

AI meeting intelligence for Zoom, Google Meet, and Microsoft Teams. A Chrome extension captures meeting audio invisibly, a FastAPI backend transcribes with Whisper and summarizes with GPT-4o, and a Next.js dashboard surfaces structured intelligence — action items, decisions, follow-ups, and more.

---

## How it works

1. Open a meeting on Zoom, Google Meet, or Teams
2. Click the Minutz extension and hit **Start Recording**
3. Audio is chunked every 10 seconds and uploaded in the background
4. Stop recording — Whisper transcribes, GPT-4o summarizes
5. Open the dashboard to read your structured meeting summary
6. Optionally push the summary to Slack in one click

---

## Stack

| Layer | Tech |
|---|---|
| Extension | Chrome MV3, offscreen document for tab audio capture |
| Backend | Python FastAPI, OpenAI Whisper + GPT-4o, Supabase |
| Dashboard | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| Database | Supabase (PostgreSQL) |

---

## Project structure

```
/backend      FastAPI app — transcription, summarization, Slack export
/extension    Chrome MV3 extension — audio capture and chunk upload
/dashboard    Next.js dashboard — meeting list, detail view, settings
```

---

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Supabase project
- OpenAI API key
- Chrome (for the extension)

---

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C0XXXXXXXXX
```

Start the server:

```bash
uvicorn main:app --reload --port 8001
```

---

### 2. Dashboard

```bash
cd dashboard
npm install
```

Create `dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:

```bash
npm run dev
```

Dashboard runs at `http://localhost:3000`.

---

### 3. Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `/extension` folder
4. The Minutz icon appears in your toolbar

---

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/upload-chunk` | Upload an audio chunk from the extension |
| POST | `/finalize/{session_id}` | Concatenate chunks, transcribe, and summarize |
| POST | `/summarize` | Summarize a transcript (standalone) |
| GET | `/meetings` | List all meetings |
| GET | `/meeting/{id}` | Full meeting detail |
| GET | `/meeting/{id}/status` | Meeting processing status |
| POST | `/send-to-slack` | Post summary to a Slack channel |

---

## Niche modes

Minutz supports four summarization modes that tune the GPT-4o prompt for different meeting types:

| Mode | Best for |
|---|---|
| `general` | All-purpose meetings |
| `sales` | Sales calls, demos, discovery |
| `pm` | Sprint planning, standups, retros |
| `financial` | Earnings calls, budget reviews |

---

## Supabase schema

The backend expects three tables: `meetings`, `transcripts`, and `summaries`. Set these up in your Supabase project before running the backend.

---

## Environment variables reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for Whisper and GPT-4o |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `SLACK_WEBHOOK_URL` | Incoming webhook URL for Slack |
| `SLACK_BOT_TOKEN` | Slack bot token (for API-based posting) |
| `SLACK_CHANNEL_ID` | Target Slack channel ID |

### Dashboard (`dashboard/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
