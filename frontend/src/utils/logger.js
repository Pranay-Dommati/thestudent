// Simple logger utility. Logs are DISABLED in production regardless of env flag.
// To enable logs locally, set VITE_DEBUG_LOGS=true when running in development.
const isDebug = (import.meta.env.MODE !== 'production') && (import.meta.env.VITE_DEBUG_LOGS === 'true');

export const log = (...args) => { if (isDebug) console.log(...args); };
export const info = (...args) => { if (isDebug) console.info?.(...args); };
export const warn = (...args) => { if (isDebug) console.warn(...args); };
export const error = (...args) => { if (isDebug) console.error(...args); };

export default { log, info, warn, error };
