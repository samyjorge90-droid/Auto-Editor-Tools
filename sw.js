/* Auto Editor Tools - service worker
   - Ficheiros da app: REDE PRIMEIRO (atualizações aparecem sozinhas quando há internet)
     e CACHE se estiveres offline.
   - Tailwind (CDN): cache primeiro (guardado na 1.ª abertura com internet). */
const CACHE = 'aet-v4';
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
  "icons/srt-favicon-64.png",
  "icons/srt-icon-header.png",
  "index.html",
  "manifest.webmanifest",
  "tools/fx.html",
  "tools/planeador.html",
  "tools/separador.html",
  "tools/srt-app.css",
  "tools/srt-pwa.js",
  "tools/srt-tw-local.css",
  "tools/srt.html"
];
const EXTERNAL = ['https://cdn.tailwindcss.com'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // cache:'reload' ignora a cache HTTP do navegador, para nunca guardar versões antigas
    await Promise.all(ASSETS.map(async (u) => {
      const r = await fetch(new Request(u, { cache: 'reload' }));
      if (!r.ok) throw new Error('Falhou: ' + u);
      await c.put(u, r);
    }));
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
  const external = new URL(req.url).origin !== location.origin;
  if (external && !EXTERNAL.some((u) => req.url.startsWith(u))) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (external) {
      const hit = await cache.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }
      catch (_) { return Response.error(); }
    }
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ]);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (_) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      return Response.error();
    }
  })());
});
