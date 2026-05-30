let recorder = null;
let stream = null;
let sessionId = null;
let audioContext = null;
let micStream = null;

function clearRecorder() {
  if (recorder && recorder.state !== "inactive") {
    try { recorder.stop(); } catch (_) {}
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  recorder = null;
  stream = null;
  sessionId = null;
}

async function createTabStream(streamId) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });
}

async function createMixedStream(streamId) {
  const tabStream = await createTabStream(streamId);

  try {
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      },
      video: false
    });

    // Mix tab + mic via Web Audio API
    const ctx = new AudioContext();
    audioContext = ctx;
    micStream = mic;

    const destination = ctx.createMediaStreamDestination();
    ctx.createMediaStreamSource(tabStream).connect(destination);
    ctx.createMediaStreamSource(mic).connect(destination);

    // Keep tab stream reference for cleanup
    stream = tabStream;

    chrome.runtime.sendMessage({ type: "micStatus", hasMic: true }, () => {
      void chrome.runtime.lastError;
    });

    return destination.stream;
  } catch (err) {
    // Mic denied or unavailable — fall back to tab-only
    console.warn("[Minutz Offscreen] Mic unavailable, using tab-only:", err.message);
    stream = tabStream;

    chrome.runtime.sendMessage({ type: "micStatus", hasMic: false, reason: err.name }, () => {
      void chrome.runtime.lastError;
    });

    return tabStream;
  }
}

async function startRecorder({ streamId, chunkMs, nextSessionId }) {
  if (recorder && recorder.state !== "inactive") {
    throw new Error("Recorder already running");
  }

  const recordStream = await createMixedStream(streamId);
  sessionId = nextSessionId;

  recorder = new MediaRecorder(recordStream, {
    mimeType: "audio/webm;codecs=opus"
  });

  recorder.ondataavailable = async (event) => {
    if (!event.data || event.data.size === 0 || !sessionId) return;
    const buffer = await event.data.arrayBuffer();

    chrome.runtime.sendMessage({
      type: "offscreenChunk",
      session_id: sessionId,
      mime_type: "audio/webm;codecs=opus",
      buffer: Array.from(new Uint8Array(buffer))
    });
  };

  recorder.onstop = () => {
    chrome.runtime.sendMessage({
      type: "offscreenStopped",
      session_id: sessionId
    });
    clearRecorder();
  };

  recorder.start(chunkMs);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "offscreenStart") {
    startRecorder({
      streamId: message.streamId,
      chunkMs: message.chunkMs,
      nextSessionId: message.session_id
    })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        clearRecorder();
        sendResponse({ ok: false, error: error?.message || "Failed to start recorder" });
      });
    return true;
  }

  if (message?.type === "offscreenStop") {
    if (!recorder || recorder.state === "inactive") {
      sendResponse({ ok: true });
      return false;
    }

    recorder.onstop = () => {
      chrome.runtime.sendMessage({
        type: "offscreenStopped",
        session_id: sessionId
      });
      clearRecorder();
      sendResponse({ ok: true });
    };

    try {
      recorder.requestData();
      recorder.stop();
    } catch (error) {
      clearRecorder();
      sendResponse({ ok: false, error: error?.message || "Failed to stop recorder" });
    }
    return true;
  }

  return false;
});
