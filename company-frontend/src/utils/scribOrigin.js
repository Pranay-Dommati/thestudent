// Origin of the public Scrib app, used to build influencer referral / dashboard links.
//
// Priority:
//   1. VITE_SCRIB_ORIGIN env var (set this in every environment for reliable links)
//   2. https://scrib.easylearnova.com when running on an easylearnova.com host
//   3. Dev fallback: same host as the admin panel, port shifted 5173 -> 5174
export function getScribOrigin() {
  const configured = import.meta.env.VITE_SCRIB_ORIGIN;
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('easylearnova.com')) {
      return 'https://scrib.easylearnova.com';
    }
    return window.location.origin.replace('5173', '5174');
  }

  return 'https://scrib.easylearnova.com';
}

export default getScribOrigin;
