const UI_STATE_KEY = "popupUiState";

const statusDot = document.getElementById("statusDot");
const meetingBadge = document.getElementById("meetingBadge");
const meetingTitleInput = document.getElementById("meetingTitleInput");
const statusCard = document.getElementById("statusCard");
const primaryBtn = document.getElementById("primaryBtn");

let timerHandle = null;
let uiState = {
  status: "idle",
  startedAt: null,
  sessionId: null,
  meetingDetected: false,
  meetingProvider: null,
  meetingTitle: ""
};

function providerFromUrl(url) {
  if (/^https?:\/\/[^/]*\.zoom\.us\//i.test(url || "")) return "Zoom";
  if (/^https?:\/\/meet\.google\.com\//i.test(url || "")) return "Google Meet";
  if (/^https?:\/\/[^/]*\.teams\.microsoft\.com\//i.test(url || "")) return "Teams";
  return null;
}

function normalizeMeetingTitle(value) {
  return String(value || "").trim();
}

function formatElapsed(startedAt) {
  if (!startedAt) return "0:00";
  const elapsedMs = Math.max(0, Date.now() - startedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderBadge() {
  if (uiState.meetingDetected && uiState.meetingProvider) {
    meetingBadge.className = "pill detected";
    meetingBadge.textContent = `${uiState.meetingProvider} detected`;
  } else {
    meetingBadge.className = "pill idle";
    meetingBadge.textContent = "Open a meeting to start";
  }
}

function renderDot() {
  statusDot.className = "dot";
  if (uiState.status === "recording") statusDot.classList.add("recording");
  if (uiState.status === "processing") statusDot.classList.add("processing");
  if (uiState.status === "done") statusDot.classList.add("done");
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startTimer() {
  stopTimer();
  timerHandle = setInterval(() => {
    if (uiState.status === "recording") {
      statusCard.textContent = `Recording... ${formatElapsed(uiState.startedAt)}`;
    }
  }, 1000);
}

function renderButton() {
  // Clear any extra buttons from done state
  const extraBtn = document.getElementById("secondaryBtn");
  if (extraBtn) extraBtn.remove();

  primaryBtn.disabled = false;
  primaryBtn.className = "action";
  primaryBtn.innerHTML = "";

  if (uiState.status === "idle") {
    primaryBtn.classList.add("primary");
    primaryBtn.textContent = "🎙 Start Recording";
    primaryBtn.disabled = !uiState.meetingDetected;
    return;
  }

  if (uiState.status === "recording") {
    primaryBtn.classList.add("stop");
    primaryBtn.textContent = "⏹ Stop Recording";
    return;
  }

  if (uiState.status === "processing") {
    primaryBtn.classList.add("processing");
    primaryBtn.innerHTML = '<span class="spinner"></span>Processing...';
    primaryBtn.disabled = true;
    return;
  }

  if (uiState.status === "done") {
    primaryBtn.classList.add("done");
    primaryBtn.textContent = "View Summary →";

    const secondaryBtn = document.createElement("button");
    secondaryBtn.id = "secondaryBtn";
    secondaryBtn.className = "action secondary";
    secondaryBtn.textContent = "Record another meeting";
    secondaryBtn.addEventListener("click", () => { resetToIdle(); });
    primaryBtn.insertAdjacentElement("afterend", secondaryBtn);
    return;
  }

  primaryBtn.classList.add("primary");
  primaryBtn.textContent = "🎙 Start Recording";
}

function renderStatusCard() {
  if (uiState.status === "idle") {
    statusCard.textContent = "Ready to record";
    stopTimer();
    return;
  }

  if (uiState.status === "recording") {
    statusCard.textContent = `Recording... ${formatElapsed(uiState.startedAt)}`;
    startTimer();
    return;
  }

  if (uiState.status === "processing") {
    statusCard.textContent = "Processing your meeting...";
    stopTimer();
    return;
  }

  if (uiState.status === "done") {
    stopTimer();
    const title = uiState.meetingTitle || "Your meeting";
    const stats = uiState.transcriptWords
      ? `~${uiState.transcriptWords} words transcribed`
      : "Processed successfully";
    statusCard.innerHTML = `
      <div class="success-card">
        <div class="success-check">✓</div>
        <div class="success-title">Meeting saved!</div>
        <div class="success-subtitle">${title}</div>
        <div class="success-stats">${stats}</div>
      </div>`;
    return;
  }

  statusCard.textContent = "Ready to record";
  stopTimer();
}

function render() {
  if (meetingTitleInput && meetingTitleInput !== document.activeElement) {
    meetingTitleInput.value = uiState.meetingTitle || "";
  }

  renderBadge();
  renderDot();
  renderStatusCard();
  renderButton();
}

async function persistState() {
  await chrome.storage.local.set({ [UI_STATE_KEY]: uiState });
}

async function setUiState(patch) {
  uiState = { ...uiState, ...patch };
  render();
  await persistState();
}

async function resetToIdle() {
  await chrome.storage.local.remove([UI_STATE_KEY]);
  uiState = {
    status: "idle",
    startedAt: null,
    sessionId: null,
    meetingDetected: uiState.meetingDetected,
    meetingProvider: uiState.meetingProvider,
    meetingTitle: ""
  };
  render();
  await persistState();
}

async function detectMeetingTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const provider = providerFromUrl(tab?.url || "");
  await setUiState({
    meetingDetected: Boolean(provider),
    meetingProvider: provider
  });
}

async function hydrateState() {
  const [storedUi, bgState] = await Promise.all([
    chrome.storage.local.get([UI_STATE_KEY]),
    chrome.runtime.sendMessage({ type: "getState" })
  ]);

  if (storedUi?.[UI_STATE_KEY]) {
    uiState = { ...uiState, ...storedUi[UI_STATE_KEY] };
  }

  const recordingState = bgState?.recordingState;
  if (recordingState?.status === "recording") {
    uiState.status = "recording";
    uiState.sessionId = recordingState.sessionId || uiState.sessionId;
    uiState.startedAt = recordingState.startedAt || uiState.startedAt || Date.now();
    uiState.meetingTitle = recordingState.meetingTitle || uiState.meetingTitle;
  }
  if (recordingState?.status === "processing") {
    uiState.status = "processing";
  }

  await detectMeetingTab();
  render();
  await persistState();
}

async function onPrimaryClick() {
  if (uiState.status === "done") {
    await chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
    return;
  }

  if (uiState.status === "idle") {
    const meetingTitle = normalizeMeetingTitle(meetingTitleInput?.value || uiState.meetingTitle);
    const response = await chrome.runtime.sendMessage({
      type: "startRecording",
      meeting_title: meetingTitle
    });

    if (!response?.ok) {
      statusCard.textContent = response?.error || "Unable to start recording";
      return;
    }

    await setUiState({
      status: "recording",
      startedAt: Date.now(),
      sessionId: response.session_id || null,
      meetingTitle
    });
    return;
  }

  if (uiState.status === "recording") {
    await setUiState({ status: "processing", startedAt: null });

    const response = await chrome.runtime.sendMessage({ type: "stopRecording" });
    if (!response?.ok) {
      statusCard.textContent = response?.error || "Unable to stop recording";
      await setUiState({ status: "idle", startedAt: null });
      return;
    }

    await setUiState({
      status: "done",
      sessionId: response.session_id || uiState.sessionId
    });
  }
}

if (meetingTitleInput) {
  meetingTitleInput.addEventListener("input", () => {
    setUiState({ meetingTitle: normalizeMeetingTitle(meetingTitleInput.value) }).catch(() => {});
  });
}

primaryBtn.addEventListener("click", () => {
  onPrimaryClick().catch((error) => {
    statusCard.textContent = error?.message || "Unexpected error";
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "status" && message?.type !== "PIPELINE_COMPLETE") return;

  if (message.type === "PIPELINE_COMPLETE") {
    setUiState({ status: "done", transcriptWords: message.transcript_length || 0 }).catch(() => {});
    return;
  }

  if (message.status === "recording") {
    setUiState({ status: "recording" }).catch(() => {});
    return;
  }

  if (message.status === "processing") {
    setUiState({ status: "processing" }).catch(() => {});
    return;
  }

  if (message.status === "done") {
    setUiState({ status: "done" }).catch(() => {});
    return;
  }

  if (message.status === "error") {
    stopTimer();
    statusCard.textContent = message.detail || "Something went wrong";
    setUiState({ status: "idle", startedAt: null }).catch(() => {});
  }
});

hydrateState().catch((error) => {
  statusCard.textContent = error?.message || "Failed to initialize";
});
