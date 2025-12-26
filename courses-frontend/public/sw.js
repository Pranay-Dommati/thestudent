/*
  Minimal Service Worker: Stale-While-Revalidate for course lists
  - Caches GET responses for selected endpoints
  - Serves cached content immediately when available, then updates cache
  - Scope: root (registered from /sw.js)
*/

const CACHE_NAME = 'el-cache-v1';
const API_PATHS = [
  '/courses/school/',
  '/courses/engineering/',
  '/courses/all/',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function shouldHandle(event) {
  const { request } = event;
  if (request.method !== 'GET') return false;
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false; // same-origin only
    return API_PATHS.some((p) => url.pathname.startsWith(p));
  } catch {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  if (!shouldHandle(event)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((resp) => {
          if (resp && resp.ok) cache.put(event.request, resp.clone());
          return resp;
        })
        .catch(() => cached); // offline fallback

      // Return cached immediately if available, otherwise wait for network
      return cached || networkFetch;
    })()
  );
});
