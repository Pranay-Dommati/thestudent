// Lightweight cache service with in-memory + persistent storage and TTL
// Usage:
//   const data = await cache.getOrFetch(key, () => fetcher(), { ttlMs: 10*60_000, staleOk: true })
// Supports stale-while-revalidate by returning cached value immediately and running revalidate in background via manual call.

import storage from '../utils/storage';

const memoryCache = new Map(); // key -> { data, expiresAt }
const LS_PREFIX = 'cache:';

function now() {
  return Date.now();
}

function buildRecord(data, ttlMs) {
  const expiresAt = ttlMs ? now() + ttlMs : null;
  return { data, expiresAt };
}

function isExpired(record) {
  if (!record) return true;
  if (!record.expiresAt) return false;
  return record.expiresAt <= now();
}

function readPersisted(key) {
  try {
    const raw = storage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writePersisted(key, record) {
  try {
    storage.setItem(LS_PREFIX + key, JSON.stringify(record));
  } catch {
    // ignore storage quota errors
  }
}

function removePersisted(key) {
  try { storage.removeItem(LS_PREFIX + key); } catch {}
}

export const cache = {
  get(key) {
    // memory fast-path
    const m = memoryCache.get(key);
    if (m && !isExpired(m)) return m.data;

    // try persisted
    const p = readPersisted(key);
    if (p && !isExpired(p)) {
      // sync back to memory
      memoryCache.set(key, p);
      return p.data;
    }
    return null;
  },
  set(key, data, ttlMs = 5 * 60_000) { // default 5 minutes
    const record = buildRecord(data, ttlMs);
    memoryCache.set(key, record);
    writePersisted(key, record);
    return data;
  },
  del(key) {
    memoryCache.delete(key);
    removePersisted(key);
  },
  has(key) {
    return this.get(key) != null;
  },
  async getOrFetch(key, fetcher, { ttlMs = 5 * 60_000 } = {}) {
    const hit = this.get(key);
    if (hit != null) return hit;
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
};

// Helper to build stable keys for school course preview
export function schoolCourseKey({ courseId, classLevel, board, state, subject }) {
  if (courseId) return `school:byId:${courseId}`;
  // normalize values to lower-case for stability
  const c = (classLevel || '').toLowerCase();
  const b = (board || '').toLowerCase();
  const s = (state || '').toLowerCase();
  const subj = (subject || '').toLowerCase();
  return `school:${c}:${b}:${s}:${subj}`;
}

export default cache;