// Safe storage utility with fallbacks and quota handling
// Prefers localStorage; falls back to sessionStorage; then to cookies; finally to in-memory map.

const memoryStore = new Map();

// --- Cookie helpers (used as durable fallback on browsers that block Web Storage, e.g., iOS private mode) ---
function setCookie(key, value, days = 30) {
  try {
    const encodedKey = encodeURIComponent(key);
    const encodedVal = encodeURIComponent(value);
    const maxAge = Math.floor(days * 24 * 60 * 60);
    const secure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodedKey}=${encodedVal}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
    return true;
  } catch {
    return false;
  }
}

function getCookie(key) {
  try {
    const name = encodeURIComponent(key) + '=';
    const parts = (document.cookie || '').split(';');
    for (let part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(name)) {
        return decodeURIComponent(trimmed.substring(name.length));
      }
    }
  } catch {}
  return null;
}

function removeCookie(key) {
  try {
    const encodedKey = encodeURIComponent(key);
    // Expire immediately
    document.cookie = `${encodedKey}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {}
}

function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = `__test_${type}_${Date.now()}`;
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocal = typeof window !== 'undefined' && isStorageAvailable('localStorage');
const hasSession = typeof window !== 'undefined' && isStorageAvailable('sessionStorage');

function setItem(key, value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  // Try localStorage
  if (hasLocal) {
    try {
      window.localStorage.setItem(key, str);
      return true;
    } catch (err) {
      // QuotaExceededError handling: attempt to free space for known large keys
      // Clear older pro learning markers; these are safe to drop
      try {
        Object.keys(window.localStorage)
          .filter(k => k.startsWith('proLearning_') || k.includes('courseReady') || k.includes('completedTopics'))
          .slice(0, 10)
          .forEach(k => window.localStorage.removeItem(k));
        window.localStorage.setItem(key, str);
        return true;
      } catch {
        // fallthrough to session/memory
      }
    }
  }
  // Try sessionStorage
  if (hasSession) {
    try {
      window.sessionStorage.setItem(key, str);
      return true;
    } catch {
      // ignore and fall through
    }
  }
  // Try cookies (durable across reloads even if Web Storage unavailable)
  if (typeof document !== 'undefined') {
    const ok = setCookie(key, str, key.toLowerCase().includes('refresh') ? 30 : 7);
    if (ok) return true;
  }
  // Fallback to in-memory
  memoryStore.set(key, str);
  return true;
}

function getItem(key) {
  // Prefer local
  if (hasLocal) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
  // Then session
  if (hasSession) {
    try {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
  // Then cookies
  if (typeof document !== 'undefined') {
    const val = getCookie(key);
    if (val !== null) return val;
  }
  // Memory fallback
  return memoryStore.get(key) ?? null;
}

function removeItem(key) {
  if (hasLocal) {
    try { window.localStorage.removeItem(key); } catch {}
  }
  if (hasSession) {
    try { window.sessionStorage.removeItem(key); } catch {}
  }
  if (typeof document !== 'undefined') {
    removeCookie(key);
  }
  memoryStore.delete(key);
}

function clearAuthTokens() {
  removeItem('accessToken');
  removeItem('refreshToken');
}

export default {
  setItem,
  getItem,
  removeItem,
  clearAuthTokens,
};
