// A "From YouTube" organise runs server-side (Celery) and outlives the page that
// started it. This module is the single client-side record of that job:
//   - ACTIVE : a job that is still running (its id, the pasted url, latest stage)
//   - RESULT : a finished job's topics, waiting for the user to open them
//   - ERROR  : a terminal failure message, waiting to be shown once
//
// All three are mirrored to localStorage so a reload, a second tab, or leaving
// and coming back all see the same state. The `storage` event only fires in
// *other* tabs, so a same-tab listener list covers updates within this tab.

const ACTIVE_KEY = 'scrib_yt_active_job'
const RESULT_KEY = 'scrib_yt_result'
const ERROR_KEY = 'scrib_yt_error'
const RESULT_MAX_AGE_MS = 60 * 60 * 1000   // drop a result nobody opened within an hour
const ACTIVE_MAX_AGE_MS = 16 * 60 * 1000   // > the server's 15-min job TTL: older can't still be alive

const listeners = new Set()

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch { /* private mode / quota — degrade to this tab only */ }
  // Copy first: a listener may itself write (e.g. consume-then-clear).
  for (const fn of [...listeners]) {
    try { fn() } catch { /* a broken subscriber must not stop the rest */ }
  }
}

export const ytJob = {
  getActive: () => {
    const a = read(ACTIVE_KEY)
    if (a && Date.now() - (a.startedAt || 0) > ACTIVE_MAX_AGE_MS) {
      write(ACTIVE_KEY, null)
      return null
    }
    return a
  },
  setActive: (info) => write(ACTIVE_KEY, info),
  patchActive: (patch) => {
    const cur = read(ACTIVE_KEY)
    if (cur) write(ACTIVE_KEY, { ...cur, ...patch })
  },
  clearActive: () => write(ACTIVE_KEY, null),

  getResult: () => {
    const r = read(RESULT_KEY)
    if (r && Date.now() - (r.savedAt || 0) > RESULT_MAX_AGE_MS) {
      write(RESULT_KEY, null)
      return null
    }
    return r
  },
  setResult: (result) => write(RESULT_KEY, { ...result, savedAt: Date.now() }),
  clearResult: () => write(RESULT_KEY, null),

  getError: () => read(ERROR_KEY),
  setError: (message) => write(ERROR_KEY, { message, savedAt: Date.now() }),
  clearError: () => write(ERROR_KEY, null),

  subscribe: (fn) => {
    listeners.add(fn)
    const onStorage = (e) => {
      if (!e.key || e.key === ACTIVE_KEY || e.key === RESULT_KEY || e.key === ERROR_KEY) fn()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(fn)
      window.removeEventListener('storage', onStorage)
    }
  },
}
