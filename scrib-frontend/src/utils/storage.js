// Safe storage utility with fallbacks and quota handling.
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
  if (hasLocal) {
    try {
      window.localStorage.setItem(key, str);
      return true;
    } catch {
      // fallthrough
    }
  }
  if (hasSession) {
    try {
      window.sessionStorage.setItem(key, str);
      return true;
    } catch {
      // fallthrough
    }
  }
  memoryStore.set(key, str);
  return true;
}

function getItem(key) {
  if (hasLocal) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
  if (hasSession) {
    try {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore
    }
  }
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
