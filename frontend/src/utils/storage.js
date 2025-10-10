// Safe storage utility with fallbacks and quota handling
// Prefers localStorage; falls back to sessionStorage; then to in-memory map.

const memoryStore = new Map();

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
