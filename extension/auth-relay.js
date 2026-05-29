(function () {
  function isExtensionValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id)
    } catch (e) {
      return false
    }
  }

  function findSupabaseSession() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key)
          const parsed = JSON.parse(raw)
          const user = parsed?.user || parsed?.currentSession?.user
          if (user) return { email: user.email, id: user.id }
        }
      }
    } catch (e) {}
    return null
  }

  function safeSendMessage(msg) {
    if (!isExtensionValid()) {
      clearInterval(intervalId)
      return
    }
    try {
      chrome.runtime.sendMessage(msg)
    } catch (e) {
      clearInterval(intervalId)
    }
  }

  // Only relay auth if we found a session on THIS page.
  // Never send MINUTZ_SIGNOUT from content script — sign out detection
  // is handled by the dashboard sign out button clearing localStorage.
  function relay() {
    const user = findSupabaseSession()
    if (user) {
      safeSendMessage({ type: 'MINUTZ_AUTH', user })
    }
  }

  relay()

  let count = 0
  const intervalId = setInterval(() => {
    if (!isExtensionValid()) {
      clearInterval(intervalId)
      return
    }
    relay()
    count++
    if (count > 100) clearInterval(intervalId)
  }, 3000)
})()
