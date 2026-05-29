const UI_STATE_KEY = "popupUiState";

const statusDot = document.getElementById("statusDot");
const meetingBadge = document.getElementById("meetingBadge");
const meetingTitleInput = document.getElementById("meetingTitleInput");
const statusCard = document.getElementById("statusCard");
const statusText = document.getElementById("statusText");
const statusSubtext = document.getElementById("statusSubtext");
const statusDotLabel = document.getElementById("statusDotLabel");
const historyBtn = document.getElementById("historyBtn");
const historyBackBtn = document.getElementById("historyBackBtn");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const primaryBtn = document.getElementById("primaryBtn");
const authScreen = document.getElementById("authScreen");
const mainUi = document.getElementById("mainUi");
const authLoginBtn = document.getElementById("authLoginBtn");
const authConfirmBtn = document.getElementById("authConfirmBtn");
const authStatus = document.getElementById("authStatus");

if (mainUi) mainUi.hidden = true;

let timerHandle = null;
let pipelineStage = null;
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

function truncateTitle(title) {
  const text = String(title || "").trim() || "Untitled";
  if (text.length <= 30) return text;
  return `${text.slice(0, 30).trimEnd()}…`;
}

function formatMeetingDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  if (uiState.status === "processing") {
    setStatusVisual(pipelineStage || "uploading");
    return;
  }

  if (uiState.status === "done") {
    setStatusVisual("done");
    return;
  }

  if (uiState.status === "recording") {
    setStatusVisual("recording");
    return;
  }

  setStatusVisual("idle");
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
      if (statusText) statusText.textContent = `Recording... ${formatElapsed(uiState.startedAt)}`;
    }
  }, 1000);
}

function showMainUi() {
  if (authScreen) authScreen.hidden = true;
  if (mainUi) mainUi.hidden = false;
}

function showAuthScreen() {
  stopTimer();
  if (mainUi) mainUi.hidden = true;
  if (authScreen) authScreen.hidden = false;
  if (authStatus) authStatus.textContent = "";
}

async function waitForStoredUser(maxAttempts = 20, delayMs = 250) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const authState = await chrome.storage.local.get(["minutz_user"]);
    const storedUser = authState?.minutz_user;
    if (storedUser?.email && storedUser?.token) {
      return storedUser;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

function showHistoryPanel() {
  if (historyPanel) historyPanel.hidden = false;
}

function hideHistoryPanel() {
  if (historyPanel) historyPanel.hidden = true;
}

function setStatusVisual(stage) {
  if (!statusDot) return;

  statusDot.className = "dot";
  if (stage === "uploading") statusDot.classList.add("uploading");
  if (stage === "transcribing" || stage === "analyzing") statusDot.classList.add("pulsing");
  if (stage === "done") statusDot.classList.add("done");
  if (stage === "recording") statusDot.classList.add("recording");

  if (statusDotLabel) {
    statusDotLabel.textContent = stage || "idle";
  }
}

function setStatusCard(mainText, subText, stage) {
  if (statusText) statusText.textContent = mainText;
  if (statusSubtext) statusSubtext.textContent = subText;
  setStatusVisual(stage);
}

function historyBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "processing") return "processing";
  if (normalized === "pending") return "pending";
  return "pending";
}

function renderHistoryState(message, buttonLabel) {
  if (!historyList) return;

  historyList.innerHTML = "";
  const stateRow = document.createElement("div");
  stateRow.className = "history-error";
  const messageNode = document.createElement("div");
  messageNode.textContent = message;
  stateRow.appendChild(messageNode);

  if (buttonLabel) {
    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "history-retry";
    retryBtn.textContent = buttonLabel;
    retryBtn.addEventListener("click", () => {
      loadHistory().catch((error) => {
        renderHistoryState(error?.message || "Could not load", "Retry");
      });
    });
    stateRow.appendChild(retryBtn);
  }

  historyList.appendChild(stateRow);
}

function renderHistoryRows(meetings) {
  if (!historyList) return;

  historyList.innerHTML = "";

  if (!meetings.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No meetings yet";
    historyList.appendChild(empty);
    return;
  }

  meetings.forEach((meeting) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.tabIndex = 0;

    const main = document.createElement("div");
    main.className = "history-row-main";

    const title = document.createElement("div");
    title.className = "history-row-title";
    title.textContent = truncateTitle(meeting.title);

    const meta = document.createElement("div");
    meta.className = "history-row-meta";

    const date = document.createElement("span");
    date.textContent = formatMeetingDate(meeting.created_at);

    meta.appendChild(date);
    main.appendChild(title);
    main.appendChild(meta);

    const badge = document.createElement("span");
    const badgeClass = historyBadgeClass(meeting.status);
    badge.className = `history-badge ${badgeClass}`;
    badge.textContent = String(meeting.status || "pending");

    row.appendChild(main);
    row.appendChild(badge);

    const openMeeting = () => {
      chrome.tabs.create({ url: `http://localhost:3000/dashboard/meeting/${meeting.id}` });
    };

    row.addEventListener("click", openMeeting);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMeeting();
      }
    });

    historyList.appendChild(row);
  });
}

async function loadHistory() {
  if (!historyList) return;

  renderHistoryState("Loading recent meetings...", "");

  try {
    const response = await fetch("http://localhost:8001/meetings");
    if (!response.ok) throw new Error("Could not load");

    const meetings = await response.json();
    const recentMeetings = [...(Array.isArray(meetings) ? meetings : [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    renderHistoryRows(recentMeetings);
  } catch (error) {
    renderHistoryState("Could not load", "Retry");
    throw error;
  }
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
    const stage = pipelineStage;
    const label =
      stage === "uploading" ? "Uploading..." :
      stage === "transcribing" ? "Transcribing..." :
      stage === "analyzing" ? "Analyzing..." :
      "Processing...";
    primaryBtn.innerHTML = `<span class="spinner"></span>${label}`;
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
    pipelineStage = null;
    setStatusCard("Ready to record", "", "idle");
    stopTimer();
    return;
  }

  if (uiState.status === "recording") {
    setStatusCard(`Recording... ${formatElapsed(uiState.startedAt)}`, "Waiting for you to stop", "recording");
    startTimer();
    return;
  }

  if (uiState.status === "processing") {
    if (pipelineStage === "uploading") {
      setStatusCard("Uploading audio...", "Sending your recording to the server", "uploading");
    } else if (pipelineStage === "transcribing") {
      setStatusCard("Transcribing...", "Whisper is converting your audio to text", "transcribing");
    } else if (pipelineStage === "analyzing") {
      setStatusCard("Analyzing with AI...", "GPT-4o is extracting your summary and action items", "analyzing");
    } else {
      setStatusCard("Processing your meeting...", "", "processing");
    }
    stopTimer();
    return;
  }

  if (uiState.status === "done") {
    stopTimer();
    setStatusCard("Meeting saved ✓", "Your summary will be ready in ~60 seconds", "done");
    return;
  }

  setStatusCard("Ready to record", "", "idle");
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
  const authState = await chrome.storage.local.get(["minutz_user"]);
  const storedUser = authState?.minutz_user;

  if (!storedUser?.email || !storedUser?.token) {
    showAuthScreen();
    return;
  }

  showMainUi();

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
      setStatusCard(response?.error || "Unable to start recording", "", "idle");
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
    pipelineStage = "uploading";
    setStatusCard("Uploading audio...", "Sending your recording to the server", "uploading");
    await setUiState({ status: "processing", startedAt: null });

    const response = await chrome.runtime.sendMessage({ type: "stopRecording" });
    if (!response?.ok) {
      pipelineStage = null;
      setStatusCard(response?.error || "Unable to stop recording", "", "idle");
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

if (authLoginBtn) {
  authLoginBtn.addEventListener("click", () => {
    window.open("http://localhost:3000/login", "_blank", "noopener,noreferrer");
  });
}

if (authConfirmBtn) {
  authConfirmBtn.addEventListener("click", () => {
    const originalLabel = authConfirmBtn.textContent;
    authConfirmBtn.disabled = true;
    authConfirmBtn.textContent = "Checking...";
    if (authStatus) authStatus.textContent = "";

    waitForStoredUser()
      .then((storedUser) => {
        if (!storedUser) {
          throw new Error("Sign-in not detected yet. Please return to the dashboard and wait a moment.");
        }
        return hydrateState();
      })
      .catch((error) => {
        if (authScreen) authScreen.hidden = false;
        if (mainUi) mainUi.hidden = true;
        if (authStatus) authStatus.textContent = error?.message || "Failed to verify sign-in";
      })
      .finally(() => {
        authConfirmBtn.disabled = false;
        authConfirmBtn.textContent = originalLabel || "I've signed in ✓";
      });
  });
}

if (historyBtn) {
  historyBtn.addEventListener("click", () => {
    showHistoryPanel();
    loadHistory().catch(() => {});
  });
}

if (historyBackBtn) {
  historyBackBtn.addEventListener("click", () => {
    hideHistoryPanel();
  });
}

primaryBtn.addEventListener("click", () => {
  onPrimaryClick().catch((error) => {
    setStatusCard(error?.message || "Unexpected error", "", "idle");
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "STATUS_UPDATE") {
    pipelineStage = message.status || null;

    if (message.status === "uploading") {
      setStatusCard("Uploading audio...", "Sending your recording to the server", "uploading");
      return;
    }

    if (message.status === "transcribing") {
      setStatusCard("Transcribing...", "Whisper is converting your audio to text", "transcribing");
      return;
    }

    if (message.status === "analyzing") {
      setStatusCard("Analyzing with AI...", "GPT-4o is extracting your summary and action items", "analyzing");
      return;
    }

    if (message.status === "done") {
      setUiState({ status: "done", transcriptWords: message.transcript_length || 0 }).catch(() => {});
      setStatusCard("Meeting saved ✓", "Your summary will be ready in ~60 seconds", "done");
    }
    return;
  }

  if (message?.type === "PIPELINE_COMPLETE") {
    setUiState({ status: "done", transcriptWords: message.transcript_length || 0 }).catch(() => {});
    setStatusCard("Meeting saved ✓", "Your summary will be ready in ~60 seconds", "done");
    return;
  }

  if (message?.type !== "status") return;

  if (message.status === "recording") {
    setUiState({ status: "recording" }).catch(() => {});
    return;
  }

  if (message.status === "error") {
    stopTimer();
    pipelineStage = null;
    setStatusCard(message.detail || "Something went wrong", "", "idle");
    setUiState({ status: "idle", startedAt: null }).catch(() => {});
  }
});

hydrateState().catch((error) => {
  setStatusCard(error?.message || "Failed to initialize", "", "idle");
});
