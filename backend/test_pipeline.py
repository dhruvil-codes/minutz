import uuid
import requests

BASE_URL = "http://localhost:8001"
AUDIO_PATH = r"C:\Users\Dhruvil\Downloads\LIVE CALL_ A Masterclass in Real-Time Objection Handling.mp3"
NICHE = "sales"
TITLE = "Test Meeting"

session_id = str(uuid.uuid4())
print(f"Session ID: {session_id}\n")

# 1. Upload chunk
print("--- POST /upload-chunk ---")
with open(AUDIO_PATH, "rb") as f:
    resp = requests.post(
        f"{BASE_URL}/upload-chunk",
        data={"session_id": session_id, "chunk_index": "0"},
        files={"audio": (f"chunk-0.mp3", f, "audio/mpeg")},
    )
resp.raise_for_status()
print(resp.json(), "\n")

# 2. Finalize
print("--- POST /finalize ---")
resp = requests.post(
    f"{BASE_URL}/finalize/{session_id}",
    json={"niche": NICHE, "title": TITLE},
)
resp.raise_for_status()
finalize_data = resp.json()
print(finalize_data, "\n")

meeting_id = finalize_data.get("meeting_id", session_id)
transcript = finalize_data.get("transcript", "")

# 3. Summarize
print("--- POST /summarize ---")
resp = requests.post(
    f"{BASE_URL}/summarize",
    json={"meeting_id": meeting_id, "transcript": transcript, "niche": NICHE},
)
resp.raise_for_status()
import json
print(json.dumps(resp.json(), indent=2))
