const CACHE_NAME = 'tds-photocard-store-v3';
const ASSETS = [
  './',
  './index.html',
  './TDS Logo no background.png',
  './manifest.json'
];

// 1. Install & immediately activate the new Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

// 2. Delete old caches ('tds-store', 'tds-store-v2') automatically
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network-First Strategy: Always fetch latest GitHub code when online; use cache only when offline
self.addEventListener('fetch', (e) => {
  // Ignore local image blob:/data: URLs and non-GET requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  const isSameOrigin = new URL(e.request.url).origin === self.location.origin;
  const networkFetch = isSameOrigin
    ? fetch(e.request, { cache: 'no-cache' })
    : fetch(e.request);

  e.respondWith(
    networkFetch
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
