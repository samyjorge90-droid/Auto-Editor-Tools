/* Auto Editor Tools - service worker (cache-first, 100% offline) */
const CACHE = 'aet-v1';
const ASSETS = [
  "./",
  "fonts/Inter-Bold.woff",
  "fonts/Inter-ExtraBold.woff",
  "fonts/Inter-Medium.woff",
  "fonts/Inter-Regular.woff",
  "fonts/Inter-SemiBold.woff",
  "fonts/JetBrainsMono-Regular.woff",
  "fonts/fonts.css",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "index.html",
  "manifest.webmanifest",
  "tools/fx.html",
  "tools/planeador.html",
  "tools/separador.html",
  "tools/srt/css/app.css",
  "tools/srt/css/tw-local.css",
  "tools/srt/icons/apple-touch-icon.png",
  "tools/srt/icons/favicon-64.png",
  "tools/srt/icons/icon-192.png",
  "tools/srt/icons/icon-512.png",
  "tools/srt/icons/icon-header.png",
  "tools/srt/icons/icon-maskable-512.png",
  "tools/srt/index.html",
  "tools/srt/js/pwa.js"
];
/* Único recurso externo: o Tailwind (CDN). É guardado na 1.ª abertura com internet. */
const EXTERNAL = ['https://cdn.tailwindcss.com'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
    for (const url of EXTERNAL) {
      try { const r = await fetch(url); if (r.ok) { await c.put(url, r); continue; } } catch (_) {}
      try { const r = await fetch(url, { mode: 'no-cors' }); await c.put(url, r); } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const external = url.origin !== location.origin;
  if (external && !EXTERNAL.some((u) => req.url.startsWith(u))) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await caches.match('index.html'); if (idx) return idx; }
      return Response.error();
    }
  })());
});
