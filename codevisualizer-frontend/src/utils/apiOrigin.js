// Derive backend origin from VITE_API_BASE_URL; default to relative '/api' in dev
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// API_BASE is like http://127.0.0.1:8000/api
export const API_BASE = BASE;

// API_ORIGIN is like https://backend.example.com (strip trailing /api)
export const API_ORIGIN = BASE.replace(/\/api$/, '');

// Build an absolute media URL from a relative path returned by backend
export function toAbsoluteMedia(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  // Ensure leading slash
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${p}`;
}

export default {
  API_BASE,
  API_ORIGIN,
  toAbsoluteMedia,
};
