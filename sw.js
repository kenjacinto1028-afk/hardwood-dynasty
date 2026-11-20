// Hardwood Dynasty: offline support (I1). Saves live in the browser (IndexedDB), so only the game files are cached here.
// Change CACHE when you want every device to drop the old files at once; otherwise files refresh in the background on each visit.
const CACHE = 'pbl-app-v21';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'src/styles.css', 'src/desk.js', 'src/vendor-faces.js', 'src/engine.js', 'src/league.js', 'src/nba-2026.js', 'src/nba-text.js', 'src/nba-setup.js', 'src/nba-history.js', 'src/app.js', 'src/fx.js', 'src/court.js', 'src/p3.js', 'src/xp.js', 'src/career-text.js', 'src/career.js', 'src/pb.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => { })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pbl-app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Cache first (fast, works offline), refresh the copy in the background so the next visit has the newest files.
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true }) || (r.mode === 'navigate' ? await c.match('index.html') : null);
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline, and this file was not saved yet. Open the game once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }));
});
