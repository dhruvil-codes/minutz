const CHUNK_MS = 10000;
const OFFSCREEN_URL = "offscreen.html";
const BG_RUNTIME_VERSION = "minutz-bg-offscreen-v3";

const CONFIG = {
  BACKEND_URL: "https://minutz-backend.onrender.com",
  DASHBOARD_URL: "https://minutz-dashboard.vercel.app",
};

const BACKEND_BASE = CONFIG.BACKEND_URL;

console.log(BG_RUNTIME_VERSION);

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "MINUTZ_AUTH" && msg.user) {
    chrome.storage.local.set({ minutz_user: msg.user });
    console.log('[Minutz BG] User auth relayed:', msg.user.email);
  }
  if (msg?.type === "MINUTZ_SIGNOUT") {
    chrome.storage.local.remove(['minutz_user']);
    console.log('[Minutz BG] Signed out, auth cache cleared');
  }
  if (msg?.type === "SET_USER") {
    chrome.storage.local.set({ minutz_user: msg.user });
  }
});

const state = {
  tabId: null,
  sessionId: null,
  chunkIndex: 0,
  status: "idle",
  meetingTitle: "",
  pendingChunks: new Set()
};
let recordingBlinkTimer = null;
let recordingBlinkVisible = true;

function setState(patch) {
  Object.assign(state, patch);
  updateActionBadge();
  chrome.storage.local.set({
    recordingState: {
      status: state.status,
      tabId: state.tabId,
      sessionId: state.sessionId,
      chunkIndex: state.chunkIndex,
      startedAt: state.status === "recording" ? Date.now() : null,
      meetingTitle: state.meetingTitle || ""
    }
  });
}

function isMeetingUrl(url) {
  return (
    /^https?:\/\/[^/]*\.zoom\.us\//i.test(url || "") ||
    /^https?:\/\/meet\.google\.com\//i.test(url || "") ||
    /^https?:\/\/[^/]*\.teams\.microsoft\.com\//i.test(url || "")
  );
}

function broadcastStatus(status, extra = {}) {
  chrome.runtime.sendMessage({ type: "status", status, ...extra }, () => {
    void chrome.runtime.lastError;
  });
}

function sendStatusUpdate(status, extra = {}) {
  chrome.runtime.sendMessage({ type: "STATUS_UPDATE", status, ...extra }, () => {
    void chrome.runtime.lastError;
  });
}

function clearRecordingState() {
  state.tabId = null;
  state.sessionId = null;
  state.chunkIndex = 0;
  state.status = "idle";
  state.meetingTitle = "";
  state.pendingChunks = new Set();
  updateActionBadge();
  chrome.storage.local.set({
    recordingState: {
      status: "idle",
      tabId: null,
      sessionId: null,
      chunkIndex: 0,
      startedAt: null,
      meetingTitle: ""
    }
  });
}

function updateActionBadge() {
  if (state.status === "recording") {
    if (!recordingBlinkTimer) {
      recordingBlinkVisible = true;
      recordingBlinkTimer = setInterval(() => {
        recordingBlinkVisible = !recordingBlinkVisible;
        chrome.action.setBadgeText({ text: recordingBlinkVisible ? "REC" : "" });
      }, 600);
    }
    chrome.action.setBadgeText({ text: recordingBlinkVisible ? "REC" : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
    chrome.action.setTitle({ title: "Minutz - Recording in progress" });
    return;
  }

  if (recordingBlinkTimer) {
    clearInterval(recordingBlinkTimer);
    recordingBlinkTimer = null;
    recordingBlinkVisible = true;
  }

  if (state.status === "processing") {
    chrome.action.setBadgeText({ text: "..." });
    chrome.action.setBadgeBackgroundColor({ color: "#F59E0B" });
    chrome.action.setTitle({ title: "Minutz - Uploading meeting data" });
    return;
  }

  chrome.action.setBadgeText({ text: "" });
  chrome.action.setTitle({ title: "Minutz" });
}

async function ensureOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const url = chrome.runtime.getURL(OFFSCREEN_URL);
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [url]
    });
    if (contexts.length > 0) return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ["USER_MEDIA"],
      justification: "Capture meeting audio in MV3 offscreen context"
    });
  } catch (error) {
    if (!String(error?.message || "").includes("Only a single offscreen document")) {
      throw error;
    }
  }
}

async function stopOffscreenRecorder() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "offscreenStop" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: true });
    });
  });
}

async function uploadChunkOnce(sessionId, chunkIndex, bufferArray) {
  const blob = new Blob([new Uint8Array(bufferArray)], { type: "audio/webm;codecs=opus" });
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("chunk_index", String(chunkIndex));
  formData.append("audio", blob, `chunk_${chunkIndex}.webm`);

  console.log("[Minutz BG] Uploading chunk", chunkIndex, "session:", sessionId, "size:", blob.size);

  const response = await fetch(`${BACKEND_BASE}/upload-chunk`, {
    method: "POST",
    body: formData
  });

  const text = await response.clone().text();
  console.log("[Minutz BG] Chunk upload response:", response.status, text);

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}): ${text}`);
  }
}

async function uploadChunkWithRetry(sessionId, chunkIndex, buffer) {
  try {
    await uploadChunkOnce(sessionId, chunkIndex, buffer);
  } catch (err) {
    console.error("[Minutz BG] Chunk upload attempt 1 failed:", err.message);
    await new Promise((r) => setTimeout(r, 700));
    try {
      await uploadChunkOnce(sessionId, chunkIndex, buffer);
    } catch (err2) {
      console.error("[Minutz BG] Chunk upload attempt 2 failed (final):", err2.message);
      throw err2;
    }
  }
}

async function finalizeAndSummarize(sessionId, meetingTitle) {
  const title = meetingTitle || `Meeting - ${new Date().toLocaleString()}`;

  // Wait for all pending chunk uploads
  console.log("[Minutz BG] Waiting for", state.pendingChunks.size, "pending uploads before finalize");
  await Promise.all([...state.pendingChunks]);

  console.log("[Minutz BG] Calling finalize for session:", sessionId, "title:", title);
  sendStatusUpdate("transcribing", { session_id: sessionId });
  const finalizeRes = await fetch(`${BACKEND_BASE}/finalize/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, niche: "general" })
  });

  const finalizeData = await finalizeRes.json();
  console.log("[Minutz BG] Finalize response:", finalizeRes.status, JSON.stringify(finalizeData));

  if (!finalizeRes.ok) {
    throw new Error(`Finalize failed (${finalizeRes.status}): ${JSON.stringify(finalizeData)}`);
  }

  const summarizePayload = {
    meeting_id: finalizeData.meeting_id || sessionId,
    transcript: finalizeData.transcript || "",
    niche: "general"
  };

  console.log("[Minutz BG] Calling summarize, meeting_id:", summarizePayload.meeting_id, "transcript length:", summarizePayload.transcript.length);
  sendStatusUpdate("analyzing", { session_id: sessionId, meeting_id: summarizePayload.meeting_id });
  const summarizeRes = await fetch(`${BACKEND_BASE}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(summarizePayload)
  });

  const summaryData = await summarizeRes.json();
  console.log("[Minutz BG] Summarize response:", summarizeRes.status, JSON.stringify(summaryData));

  if (!summarizeRes.ok) {
    throw new Error(`Summarize failed (${summarizeRes.status}): ${JSON.stringify(summaryData)}`);
  }

  const wordCount = summarizePayload.transcript.split(/\s+/).filter(Boolean).length;

  sendStatusUpdate("done", {
    meeting_id: summarizePayload.meeting_id,
    transcript_length: wordCount
  });

  // Notify popup and show system notification
  chrome.runtime.sendMessage({
    type: "PIPELINE_COMPLETE",
    meeting_id: summarizePayload.meeting_id,
    transcript_length: wordCount
  }, () => { void chrome.runtime.lastError; });

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon-orange.png",
    title: "Minutz — Meeting saved",
    message: "Your summary and action items are ready to view."
  });

  return { meeting_id: summarizePayload.meeting_id };
}

async function stopRecorderWithFinalize(reason) {
  if (state.status !== "recording") return;

  const sessionId = state.sessionId;
  const meetingTitle = state.meetingTitle || "";

  console.log("[Minutz BG] Stop recording triggered, reason:", reason, "session:", sessionId);
  setState({ status: "processing" });
  sendStatusUpdate("uploading", { session_id: sessionId, reason });

  await stopOffscreenRecorder();

  try {
    await finalizeAndSummarize(sessionId, meetingTitle);
    broadcastStatus("done", {
      session_id: sessionId,
      detail: "Recording complete. View results in dashboard."
    });
  } catch (error) {
    console.error("[Minutz BG] Pipeline error:", error.message);
    broadcastStatus("error", { session_id: sessionId, detail: error.message });
  }

  clearRecordingState();
}

async function getTabStreamId(tabId) {
  return new Promise((resolve) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError?.message || "Unable to acquire tab stream id"
        });
        return;
      }
      resolve({ ok: true, streamId });
    });
  });
}

async function startRecording(tabId) {
  if (!chrome.tabCapture || typeof chrome.tabCapture.getMediaStreamId !== "function") {
    return {
      ok: false,
      error: "Tab capture API is unavailable. Reload the extension on chrome://extensions and try again."
    };
  }

  const streamResult = await getTabStreamId(tabId);
  if (!streamResult.ok) return streamResult;

  try {
    await ensureOffscreenDocument();
  } catch (error) {
    return { ok: false, error: error?.message || "Unable to initialize offscreen recorder" };
  }

  const sessionId = crypto.randomUUID();

  const startResult = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "offscreenStart", streamId: streamResult.streamId, chunkMs: CHUNK_MS, session_id: sessionId },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, error: "Failed to start offscreen recorder" });
      }
    );
  });

  if (!startResult.ok) return startResult;

  setState({ tabId, sessionId, chunkIndex: 0, status: "recording", pendingChunks: new Set() });
  console.log("[Minutz BG] Recording started, session:", sessionId, "tab:", tabId);
  broadcastStatus("recording", { session_id: sessionId });
  return { ok: true, session_id: sessionId };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "offscreenChunk") {
    if (message.session_id !== state.sessionId || typeof state.tabId !== "number") {
      sendResponse({ ok: false });
      return false;
    }

    const currentIndex = state.chunkIndex;
    state.chunkIndex += 1;

    console.log("[Minutz BG] Chunk captured, index:", currentIndex, "uploading directly to backend");

    const upload = uploadChunkWithRetry(state.sessionId, currentIndex, message.buffer);
    state.pendingChunks.add(upload);
    upload.finally(() => state.pendingChunks.delete(upload));

    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "offscreenStopped") {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "getState") {
    chrome.storage.local.get(["recordingState"], (result) => {
      sendResponse({
        ok: true,
        recordingState: result.recordingState || {
          status: "idle",
          sessionId: null,
          tabId: null,
          startedAt: null,
          meetingTitle: ""
        }
      });
    });
    return true;
  }

  if (message?.type === "startRecording") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const activeTab = tabs?.[0];
        const meetingTitle = String(message?.meeting_title || "").trim();

        if (!activeTab?.id || !activeTab.url?.startsWith("http")) {
          sendResponse({ ok: false, error: "Can't record this page. Open a website or meeting tab first." });
          return;
        }

        if (state.status === "recording") {
          sendResponse({ ok: false, error: "Recording already in progress" });
          return;
        }

        setState({ meetingTitle });
        const result = await startRecording(activeTab.id);
        sendResponse(result);
      } catch (error) {
        console.error("[Minutz BG] startRecording failed:", error);
        sendResponse({ ok: false, error: error?.message || "Unable to start recording" });
      }
    });
    return true;
  }

  if (message?.type === "stopRecording") {
    if (state.status !== "recording") {
      sendResponse({ ok: false, error: "No active recording" });
      return false;
    }

    const currentSessionId = state.sessionId;
    stopRecorderWithFinalize("manual")
      .then(() => sendResponse({ ok: true, session_id: currentSessionId }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "Unable to stop recording" }));
    return true;
  }

  if (message?.type === "status") {
    broadcastStatus(message.status, {
      detail: message.detail,
      meeting_id: message.meeting_id,
      session_id: message.session_id
    });
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId !== state.tabId || state.status !== "recording") return;
  if (typeof changeInfo.url === "string" && !isMeetingUrl(changeInfo.url)) {
    stopRecorderWithFinalize("tab_navigation").catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.tabId && state.status === "recording") {
    stopRecorderWithFinalize("tab_closed").catch(() => {});
  }
});
