const UI_STATE_KEY = "popupUiState";

const CONFIG = {
  BACKEND_URL: "https://minutz-backend.onrender.com",
  DASHBOARD_URL: "https://minutz-dashboard.vercel.app",
};

document.addEventListener("DOMContentLoaded", () => {
console.log("[Minutz Popup] JS loaded");

let statusDot = null;
let meetingBadge = null;
let meetingTitleInput = null;
let statusCard = null;
let statusText = null;
let statusSubtext = null;
let statusDotLabel = null;
let historyBtn = null;
let historyBackBtn = null;
let historyPanel = null;
let historyList = null;
let primaryBtn = null;
let authScreen = null;
let mainUi = null;
let signInBtn = null;
let iveSignedInBtn = null;
let authError = null;

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
  if (!url) return null;
  if (url.includes("meet.google.com/")) return "Google Meet";
  if (url.includes("zoom.us/j/") || url.includes("zoom.us/wc/")) return "Zoom";
  if (url.includes("teams.microsoft.com") && url.includes("meetup-join")) return "Microsoft Teams";
  if (url.includes("youtube.com/watch")) return "YouTube";
  if (url.startsWith("http")) return "This tab";
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
  const detectionBanner = document.getElementById("detectionBanner");
  const detectionDot = document.getElementById("detectionDot");
  const detectionText = document.getElementById("detectionText");

  if (uiState.meetingDetected && uiState.meetingProvider) {
    const platformLabels = {
      "Google Meet": "⚡ Google Meet detected",
      "Zoom": "⚡ Zoom detected",
      "Microsoft Teams": "⚡ Teams detected",
      "YouTube": "▶ YouTube — ready to record",
      "This tab": "⚡ Ready to record this tab",
    };
    const label = platformLabels[uiState.meetingProvider] || `⚡ ${uiState.meetingProvider} detected`;

    if (detectionBanner) detectionBanner.classList.add("active");
    if (detectionDot) detectionDot.style.background = "#FF6A00";
    if (detectionText) {
      detectionText.textContent = label;
      detectionText.style.color = "#FFFFFF";
    }
    if (meetingBadge) {
      meetingBadge.className = "pill detected";
      meetingBadge.textContent = label;
    }
  } else {
    if (detectionBanner) detectionBanner.classList.remove("active");
    if (detectionDot) detectionDot.style.background = "";
    if (detectionText) {
      detectionText.textContent = "Open a tab to start recording";
      detectionText.style.color = "";
    }
    if (meetingBadge) {
      meetingBadge.className = "pill idle";
      meetingBadge.textContent = "Open a tab to start recording";
    }
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

function setScreenVisibility({ authVisible }) {
  if (authScreen) {
    authScreen.hidden = !authVisible;
    authScreen.style.display = authVisible ? "flex" : "none";
  }

  if (mainUi) {
    mainUi.hidden = authVisible;
    mainUi.style.display = authVisible ? "none" : "flex";
  }
}

function showMainUi() {
  setScreenVisibility({ authVisible: false });
}

function showMainUI() {
  showMainUi();
}

function showAuthScreen() {
  stopTimer();
  setScreenVisibility({ authVisible: true });
  if (authError) {
    authError.style.display = "none";
    authError.textContent = "";
  }
}

function showError(message) {
  if (!authError) return;
  authError.style.display = "block";
  authError.textContent = message;
}

async function waitForStoredUser(maxAttempts = 20, delayMs = 250) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const authState = await chrome.storage.local.get(["minutz_user"]);
    const storedUser = authState?.minutz_user;
    if (storedUser?.email && (storedUser?.token || storedUser?.id)) {
      return storedUser;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return null;
}

function showHistoryPanel() {
  if (!historyPanel) return;
  historyPanel.hidden = false;
  historyPanel.offsetHeight;
  historyPanel.classList.add("is-open");
}

function hideHistoryPanel() {
  if (!historyPanel) return;
  historyPanel.classList.remove("is-open");
  window.setTimeout(() => {
    if (historyPanel && !historyPanel.classList.contains("is-open")) {
      historyPanel.hidden = true;
    }
  }, 180);
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
      chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/dashboard/meeting/${meeting.id}` });
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
    const response = await fetch(`${CONFIG.BACKEND_URL}/meetings`);
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

function populateUserSection(user) {
  if (!user) return;
  const avatar = document.getElementById("userAvatar");
  const email = document.getElementById("userEmail");
  if (avatar) avatar.textContent = user.email.charAt(0).toUpperCase();
  if (email) email.textContent = user.email;
}

async function checkAuth() {  // Check cached storage first (fast)
  const cached = await new Promise(resolve => {
    chrome.storage.local.get(['minutz_user'], result => {
      resolve(result.minutz_user || null);
    });
  });
  if (cached) return cached;

  // No cache — call the dashboard API
  try {
    const res = await fetch(
      `${CONFIG.DASHBOARD_URL}/api/auth/check`,
      { credentials: 'include', signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json();
    if (data.authenticated && data.user) {
      chrome.storage.local.set({ minutz_user: data.user });
      return data.user;
    }
  } catch (e) {}

  return null;
}

async function hydrateState() {
  const user = await checkAuth();
  if (!user) {
    showAuthScreen();
    return;
  }

  showMainUi();
  populateUserSection(user);

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
    await chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/dashboard` });
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

  statusDot = document.getElementById("statusDot");
  meetingBadge = document.getElementById("meetingBadge");
  meetingTitleInput = document.getElementById("meetingTitleInput");
  statusCard = document.getElementById("statusCard");
  statusText = document.getElementById("statusText");
  statusSubtext = document.getElementById("statusSubtext");
  statusDotLabel = document.getElementById("statusDotLabel");
  historyBtn = document.getElementById("historyBtn");
  historyBackBtn = document.getElementById("historyBackBtn");
  historyPanel = document.getElementById("historyPanel");
  historyList = document.getElementById("historyList");
  primaryBtn = document.getElementById("primaryBtn");
  authScreen = document.getElementById("authScreen");
  mainUi = document.getElementById("mainUi");
  signInBtn = document.getElementById("signInBtn");
  iveSignedInBtn = document.getElementById("iveSignedInBtn");
  authError = document.getElementById("authError");

  console.log("[Minutz Popup] Auth button IDs:", {
    signInBtn: signInBtn ? signInBtn.id : null,
    iveSignedInBtn: iveSignedInBtn ? iveSignedInBtn.id : null
  });

  if (authScreen) {
    authScreen.style.display = "flex";
    authScreen.hidden = false;
  }
  if (mainUi) {
    mainUi.style.display = "none";
    mainUi.hidden = true;
  }
  if (historyPanel) {
    historyPanel.hidden = true;
  }

  if (meetingTitleInput) {
    meetingTitleInput.addEventListener("input", () => {
      setUiState({ meetingTitle: normalizeMeetingTitle(meetingTitleInput.value) }).catch(() => {});
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      console.log("[Minutz Popup] Button clicked:", "signInBtn");
      chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/login` });
    });
  }

  if (iveSignedInBtn) {
    iveSignedInBtn.addEventListener("click", () => {
      console.log("[Minutz Popup] Button clicked:", "iveSignedInBtn");
      chrome.storage.local.remove(["minutz_user"], async () => {
        const user = await checkAuth();
        if (user) {
          showMainUI();
          hydrateState().catch((error) => {
            showError(error?.message || "Failed to load extension");
          });
        } else {
          showError(`Not signed in yet. Make sure you are logged in at ${CONFIG.DASHBOARD_URL} then try again.`);
        }
      });
    });
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== CONFIG.DASHBOARD_URL) return;
    if (event.data?.type !== "MINUTZ_AUTH") return;

    const user = event.data?.user;
    if (!user?.email || !(user?.token || user?.id)) return;

    if (authError) {
      authError.style.display = "block";
      authError.textContent = `Signed in as ${user.email}. Loading extension...`;
    }

    chrome.storage.local.set({ minutz_user: user }, () => {
      void chrome.runtime.lastError;
      hydrateState().catch((error) => {
        if (authError) {
          authError.style.display = "block";
          authError.textContent = error?.message || "Failed to load extension";
        }
      });
    });
  });

  if (historyBtn) {
    historyBtn.addEventListener("click", () => {
      console.log("[Minutz Popup] Button clicked:", "historyBtn");
      showHistoryPanel();
      loadHistory().catch(() => {});
    });
  }

  if (historyBackBtn) {
    historyBackBtn.addEventListener("click", () => {
      console.log("[Minutz Popup] Button clicked:", "historyBackBtn");
      hideHistoryPanel();
    });
  }

  if (primaryBtn) {
    primaryBtn.addEventListener("click", () => {
      console.log("[Minutz Popup] Button clicked:", "primaryBtn");
      onPrimaryClick().catch((error) => {
        setStatusCard(error?.message || "Unexpected error", "", "idle");
      });
    });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "micStatus") {
      if (uiState.status === "recording") {
        if (message.hasMic) {
          if (statusText) statusText.textContent = `Recording... 🎤 Mic + Tab audio`;
        } else {
          if (statusText) statusText.textContent = `Recording... (tab audio only)`;
          if (statusSubtext) statusSubtext.textContent = "Mic access denied — recording tab audio only";
        }
      }
      return;
    }

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

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && 'minutz_user' in changes) {
      if (!changes.minutz_user.newValue) {
        showAuthScreen();
      }
    }
  });

  // Restore saved status
  chrome.storage.local.get(['minutz_status'], (result) => {
    const select = document.getElementById('userStatus');
    if (select) select.value = result.minutz_status || 'available';
  });

  document.getElementById('userStatus')?.addEventListener('change', (e) => {
    chrome.storage.local.set({ minutz_status: e.target.value });
  });

  document.getElementById('openDashboardBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/dashboard` });
  });

  document.getElementById('signOutBtn')?.addEventListener('click', () => {
    chrome.storage.local.remove(['minutz_user', 'minutz_status'], () => {
      showAuthScreen();
    });
  });

  hydrateState().catch((error) => {
    setStatusCard(error?.message || "Failed to initialize", "", "idle");
  });

  // Poll for meeting detection every 2s while popup is open
  const detectionInterval = setInterval(async () => {
    if (uiState.status === "idle") {
      await detectMeetingTab();
    }
  }, 2000);

  // Also re-detect when user switches tabs
  chrome.tabs.onActivated.addListener(() => {
    detectMeetingTab().catch(() => {});
  });

  window.addEventListener("unload", () => {
    clearInterval(detectionInterval);
  });
});
