// Offline shell. Network first (so updates show up immediately), cache as the fallback.
const CACHE = 'rk-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) =>
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if ((url.origin !== location.origin && !fonts) || url.pathname.startsWith('/api/')) return;
  const key = req.mode === 'navigate' ? '/' : req;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (fonts) {
        const hit = await cache.match(req);
        if (hit) return hit;
      }
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(key, res.clone()).catch(() => {});
        return res;
      } catch (err) {
        const hit = await cache.match(key, { ignoreSearch: true });
        if (hit) return hit;
        throw err;
      }
    })(),
  );
});
