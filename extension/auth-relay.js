(function () {
  function findSupabaseSession() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const raw = localStorage.getItem(key);
          const parsed = JSON.parse(raw);
          const user = parsed?.user || parsed?.currentSession?.user;
          if (user) return { email: user.email, id: user.id };
        } catch (e) {}
      }
    }
    return null;
  }

  function relay() {
    const user = findSupabaseSession();
    if (user) {
      try {
        chrome.runtime.sendMessage({ type: 'MINUTZ_AUTH', user });
      } catch (e) {
        clearInterval(signOutInterval);
      }
    }
  }

  relay();
  let count = 0;
  const relayInterval = setInterval(() => {
    relay();
    if (++count > 15) clearInterval(relayInterval);
  }, 2000);

  function checkSignOut() {
    const user = findSupabaseSession();
    if (!user) {
      try {
        chrome.runtime.sendMessage({ type: 'MINUTZ_SIGNOUT' });
      } catch (e) {
        clearInterval(signOutInterval);
      }
    }
  }
  let signOutInterval = setInterval(checkSignOut, 3000);
})();
