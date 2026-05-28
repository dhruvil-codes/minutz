const CHUNK_MS = 10000;
const OFFSCREEN_URL = "offscreen.html";
const BG_RUNTIME_VERSION = "minutz-bg-offscreen-v2";

console.log(BG_RUNTIME_VERSION);

const state = {
  tabId: null,
  sessionId: null,
  chunkIndex: 0,
  status: "idle",
  meetingTitle: ""
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

function safeSendToTab(tabId, message) {
  if (typeof tabId !== "number") return;
  chrome.tabs.sendMessage(tabId, message, () => {
    void chrome.runtime.lastError;
  });
}

function broadcastStatus(status, extra = {}) {
  chrome.runtime.sendMessage({ type: "status", status, ...extra }, () => {
    void chrome.runtime.lastError;
  });
}

function clearRecordingState() {
  state.tabId = null;
  state.sessionId = null;
  state.chunkIndex = 0;
  state.status = "idle";
  state.meetingTitle = "";
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

    if (contexts.length > 0) {
      return;
    }
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

async function stopRecorderWithFinalize(reason) {
  if (state.status !== "recording") {
    return;
  }

  const tabId = state.tabId;
  const sessionId = state.sessionId;

  setState({ status: "processing" });
  broadcastStatus("processing", { session_id: sessionId, reason });

  await stopOffscreenRecorder();

  safeSendToTab(tabId, {
    type: "finalize",
    session_id: sessionId,
    reason,
    meeting_title: state.meetingTitle || ""
  });

  broadcastStatus("done", {
    session_id: sessionId,
    detail: "Recording complete. View results in dashboard."
  });
  chrome.tabs.create({ url: "http://localhost:3000/dashboard" }, () => {
    void chrome.runtime.lastError;
  });
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
  if (!streamResult.ok) {
    return streamResult;
  }

  try {
    await ensureOffscreenDocument();
  } catch (error) {
    return {
      ok: false,
      error: error?.message || "Unable to initialize offscreen recorder"
    };
  }

  const sessionId = crypto.randomUUID();

  const startResult = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "offscreenStart",
        streamId: streamResult.streamId,
        chunkMs: CHUNK_MS,
        session_id: sessionId
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, error: "Failed to start offscreen recorder" });
      }
    );
  });

  if (!startResult.ok) {
    return startResult;
  }

  setState({
    tabId,
    sessionId,
    chunkIndex: 0,
    status: "recording"
  });

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

    safeSendToTab(state.tabId, {
      type: "chunk",
      session_id: message.session_id,
      chunk_index: currentIndex,
      mime_type: message.mime_type || "audio/webm;codecs=opus",
      buffer: message.buffer
    });

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
      const activeTab = tabs?.[0];
      const meetingTitle = String(message?.meeting_title || "").trim();

      if (!activeTab?.id || !isMeetingUrl(activeTab.url)) {
        sendResponse({ ok: false, error: "Open a supported meeting tab first" });
        return;
      }

      if (state.status === "recording") {
        sendResponse({ ok: false, error: "Recording already in progress" });
        return;
      }

      setState({ meetingTitle });
      const result = await startRecording(activeTab.id);
      sendResponse(result);
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
  if (tabId !== state.tabId || state.status !== "recording") {
    return;
  }

  if (typeof changeInfo.url === "string" && !isMeetingUrl(changeInfo.url)) {
    stopRecorderWithFinalize("tab_navigation").catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.tabId && state.status === "recording") {
    stopRecorderWithFinalize("tab_closed").catch(() => {});
  }
});
