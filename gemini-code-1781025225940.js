const CACHE_NAME = 'rcp-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Installation et mise en cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Stratégie : Cache d'abord, sinon réseau (sécurité absolue hors-ligne)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});