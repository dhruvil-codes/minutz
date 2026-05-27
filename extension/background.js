const CHUNK_MS = 10000;

const state = {
  recorder: null,
  stream: null,
  tabId: null,
  sessionId: null,
  chunkIndex: 0,
  status: "idle"
};

function setState(patch) {
  Object.assign(state, patch);
  chrome.storage.local.set({
    recordingState: {
      status: state.status,
      tabId: state.tabId,
      sessionId: state.sessionId,
      chunkIndex: state.chunkIndex,
      startedAt: state.status === "recording" ? Date.now() : null
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
  state.recorder = null;
  state.stream = null;
  state.tabId = null;
  state.sessionId = null;
  state.chunkIndex = 0;
  state.status = "idle";
  chrome.storage.local.set({
    recordingState: {
      status: "idle",
      tabId: null,
      sessionId: null,
      chunkIndex: 0,
      startedAt: null
    }
  });
}

function stopRecorderWithFinalize(reason) {
  if (!state.recorder || state.recorder.state === "inactive") {
    return;
  }

  const tabId = state.tabId;
  const sessionId = state.sessionId;

  setState({ status: "processing" });
  broadcastStatus("processing", { session_id: sessionId, reason });

  state.recorder.onstop = () => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }

    safeSendToTab(tabId, {
      type: "finalize",
      session_id: sessionId,
      reason
    });

    clearRecordingState();
  };

  state.recorder.stop();
}

async function startRecording(tabId) {
  return new Promise((resolve) => {
    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
      if (chrome.runtime.lastError || !stream) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError?.message || "Unable to capture tab audio"
        });
        return;
      }

      const sessionId = crypto.randomUUID();
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus"
      });

      setState({
        recorder,
        stream,
        tabId,
        sessionId,
        chunkIndex: 0,
        status: "recording"
      });

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;

        const currentIndex = state.chunkIndex;
        state.chunkIndex += 1;

        const buffer = await event.data.arrayBuffer();

        safeSendToTab(tabId, {
          type: "chunk",
          session_id: sessionId,
          chunk_index: currentIndex,
          mime_type: "audio/webm;codecs=opus",
          buffer
        });
      };

      recorder.start(CHUNK_MS);
      broadcastStatus("recording", { session_id: sessionId });
      resolve({ ok: true, session_id: sessionId });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "getState") {
    chrome.storage.local.get(["recordingState"], (result) => {
      sendResponse({
        ok: true,
        recordingState: result.recordingState || {
          status: "idle",
          sessionId: null,
          tabId: null,
          startedAt: null
        }
      });
    });
    return true;
  }

  if (message?.type === "startRecording") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs?.[0];
      if (!activeTab?.id || !isMeetingUrl(activeTab.url)) {
        sendResponse({ ok: false, error: "Open a supported meeting tab first" });
        return;
      }

      if (state.status === "recording") {
        sendResponse({ ok: false, error: "Recording already in progress" });
        return;
      }

      const result = await startRecording(activeTab.id);
      sendResponse(result);
    });
    return true;
  }

  if (message?.type === "stopRecording") {
    if (!state.recorder || state.recorder.state === "inactive") {
      sendResponse({ ok: false, error: "No active recording" });
      return false;
    }

    const currentSessionId = state.sessionId;
    stopRecorderWithFinalize("manual");
    sendResponse({ ok: true, session_id: currentSessionId });
    return false;
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
    stopRecorderWithFinalize("tab_navigation");
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.tabId && state.status === "recording") {
    stopRecorderWithFinalize("tab_closed");
  }
});

