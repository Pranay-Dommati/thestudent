// Shared mapping utilities for converting between state code slugs and full names
// Extend this dictionary as we add more state boards

const STATE_CODE_TO_NAME = {
  ts: 'Telangana',
  ap: 'Andhra Pradesh',
};

export function stateCodeToName(code) {
  if (!code) return '';
  const key = String(code).toLowerCase();
  return STATE_CODE_TO_NAME[key] || code;
}

export function stateNameToCode(name) {
  if (!name) return '';
  // reverse lookup
  const entries = Object.entries(STATE_CODE_TO_NAME);
  const match = entries.find(([, full]) => String(full).toLowerCase() === String(name).toLowerCase());
  return match ? match[0] : name;
}

export function isKnownStateCode(code) {
  if (!code) return false;
  return Object.prototype.hasOwnProperty.call(STATE_CODE_TO_NAME, String(code).toLowerCase());
}

export const STATE_CODES = Object.freeze(Object.keys(STATE_CODE_TO_NAME));
export const STATE_NAMES = Object.freeze(Object.values(STATE_CODE_TO_NAME));
