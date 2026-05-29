console.log("[Minutz] Content script loaded on", location.href);

function forwardUserToBackground(user) {
  if (!user?.email || !user?.token) return;

  chrome.runtime.sendMessage({ type: "SET_USER", user }, () => {
    void chrome.runtime.lastError;
  });
}

window.addEventListener("minutz:set-user", (event) => {
  forwardUserToBackground(event?.detail);
});
