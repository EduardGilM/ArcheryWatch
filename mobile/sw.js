// ArcheryWatch service worker: app shell cache-first, sesiones network-first.
const C = 'aw-v72';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c =>
  c.addAll(['./', './index.html', './session-model.js', './training.js', './manifest.json', './icon-192.png', './icon-512.png', './fonts/Geist-Variable.woff2', './fonts/GeistMono-Variable.woff2']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks =>
  Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => e.respondWith(
  e.request.url.endsWith('.json')
    ? fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request))
    : caches.match(e.request).then(r => r || fetch(e.request))));
