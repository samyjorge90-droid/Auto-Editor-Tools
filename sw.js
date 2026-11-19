/* Auto Editor Tools - service worker (100% offline)
   - Tudo é guardado em cache na instalação (1.ª abertura com internet).
   - Depois, os ficheiros abrem SEMPRE do cache (instantâneo, mesmo sem rede ou com sinal fraco).
   - Quando há internet, a app atualiza o cache em segundo plano; a versão nova aparece na abertura seguinte.
   - Para forçar uma atualização geral, aumenta o número em CACHE (ex.: aet-v6). */
const CACHE = 'aet-v5';
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
  "tw-index.css",
  "tools/fx.html",
  "tools/fx-tw.css",
  "tools/planeador.html",
  "tools/separador.html",
  "tools/separador-tw.css",
  "tools/srt-app.css",
  "tools/srt-pwa.js",
  "tools/srt-tw-local.css",
  "tools/srt.html"
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // cache:'reload' ignora a cache HTTP do navegador, para nunca guardar versões antigas
    await Promise.all(ASSETS.map(async (u) => {
      const r = await fetch(new Request(u, { cache: 'reload' }));
      if (!r.ok) throw new Error('Falhou: ' + u);
      await c.put(u, r);
    }));
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
  if (new URL(req.url).origin !== location.origin) return; // nada externo: tudo é local
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    // atualização em segundo plano (só se houver rede); falha em silêncio quando offline
    const refresh = fetch(req, { cache: 'no-cache' })
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    if (hit) { e.waitUntil(refresh); return hit; }
    const res = await refresh;
    if (res) return res;
    if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
    return Response.error();
  })());
});
