let recorder = null;
let stream = null;
let sessionId = null;

function clearRecorder() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  recorder = null;
  stream = null;
  sessionId = null;
}

async function createStream(streamId) {
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

async function startRecorder({ streamId, chunkMs, nextSessionId }) {
  if (recorder && recorder.state !== "inactive") {
    throw new Error("Recorder already running");
  }

  stream = await createStream(streamId);
  sessionId = nextSessionId;

  recorder = new MediaRecorder(stream, {
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

    // Override onstop to respond only after the final ondataavailable has fired
    recorder.onstop = () => {
      chrome.runtime.sendMessage({
        type: "offscreenStopped",
        session_id: sessionId
      });
      clearRecorder();
      sendResponse({ ok: true });
    };

    try {
      recorder.requestData(); // flush any buffered audio before stop
      recorder.stop();
    } catch (error) {
      clearRecorder();
      sendResponse({ ok: false, error: error?.message || "Failed to stop recorder" });
    }
    return true; // async response — sendResponse called from onstop
  }

  return false;
});