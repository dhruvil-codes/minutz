const API_BASE = "http://localhost:3000/api/extension";

function sendStatus(status, detail = "", extras = {}) {
  chrome.runtime.sendMessage(
    { type: "status", status, detail, ...extras },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

async function uploadChunkOnce(sessionId, chunkIndex, blob) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("chunk_index", String(chunkIndex));
  formData.append("audio", blob, `chunk_${chunkIndex}.webm`);

  const response = await fetch(`${API_BASE}/upload-chunk`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}

async function uploadChunkWithRetry(sessionId, chunkIndex, blob) {
  try {
    await uploadChunkOnce(sessionId, chunkIndex, blob);
    sendStatus("recording", `Uploaded chunk ${chunkIndex + 1}`, {
      session_id: sessionId
    });
  } catch (_error) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      await uploadChunkOnce(sessionId, chunkIndex, blob);
      sendStatus("recording", `Uploaded chunk ${chunkIndex + 1} (retried)`, {
        session_id: sessionId
      });
    } catch (retryError) {
      sendStatus("error", `Chunk ${chunkIndex} failed after retry`, {
        session_id: sessionId
      });
      throw retryError;
    }
  }
}

async function finalizeSession(sessionId, meetingTitle = "") {
  const localNow = new Date();
  const title = meetingTitle || `Meeting - ${localNow.toLocaleString()}`;

  const finalizeResponse = await fetch(`${API_BASE}/finalize/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });

  if (!finalizeResponse.ok) {
    throw new Error(`Finalize failed (${finalizeResponse.status})`);
  }

  const finalizeData = await finalizeResponse.json();

  const summarizePayload = {
    meeting_id: finalizeData.meeting_id || sessionId,
    transcript: finalizeData.transcript || "",
    niche: "general"
  };

  const summarizeResponse = await fetch(`${API_BASE}/summarize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(summarizePayload)
  });

  if (!summarizeResponse.ok) {
    throw new Error(`Summarize failed (${summarizeResponse.status})`);
  }

  return { meeting_id: summarizePayload.meeting_id };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "chunk") {
    const { session_id: sessionId, chunk_index: chunkIndex, buffer } = message;
    const blob = new Blob([buffer], { type: "audio/webm;codecs=opus" });

    uploadChunkWithRetry(sessionId, chunkIndex, blob)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === "finalize") {
    const { session_id: sessionId, meeting_title: meetingTitle } = message;

    finalizeSession(sessionId, String(meetingTitle || "").trim())
      .then((result) => sendResponse({ ok: true, meeting_id: result.meeting_id }))
      .catch((error) => {
        sendStatus("error", error.message, { session_id: sessionId });
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  }

  return false;
});
