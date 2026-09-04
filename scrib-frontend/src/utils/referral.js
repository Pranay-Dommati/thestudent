// Influencer referral code persistence (scrib origin).
//
// Stored as JSON { code, ts } in localStorage. Expires after REFERRAL_TTL_DAYS
// so a months-old click doesn't attribute a signup.

const KEY = 'influencer_ref'
const REFERRAL_TTL_DAYS = 30
const TTL_MS = REFERRAL_TTL_DAYS * 24 * 60 * 60 * 1000

export function setReferralCode(code) {
  if (!code) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: String(code).trim().toLowerCase(), ts: Date.now() }))
  } catch {
    /* storage unavailable — ignore */
  }
}

export function getReferralCode() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    // Legacy format: a bare string.
    if (raw[0] !== '{') return raw

    const { code, ts } = JSON.parse(raw)
    if (!code) return null
    if (ts && Date.now() - ts > TTL_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}

export function clearReferralCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

// RFC4122-ish v4 UUID with a non-crypto fallback for insecure contexts
// (crypto.randomUUID is undefined on plain http, non-localhost).
export function getVisitorId() {
  try {
    let id = localStorage.getItem('visitor_id')
    if (id) return id
    id = generateUuid()
    localStorage.setItem('visitor_id', id)
    return id
  } catch {
    return generateUuid()
  }
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = crypto.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
    return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
  }
  // Last resort
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
