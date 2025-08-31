// Simple logger utility. Enable logs by setting VITE_DEBUG_LOGS=true in your env.
const isDebug = import.meta.env.VITE_DEBUG_LOGS === 'true';

export const log = (...args) => { if (isDebug) console.log(...args); };
export const info = (...args) => { if (isDebug) console.info?.(...args); };
export const warn = (...args) => { if (isDebug) console.warn(...args); };
export const error = (...args) => { if (isDebug) console.error(...args); };

export default { log, info, warn, error };
