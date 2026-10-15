self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('tds-store').then((cache) => {
      return cache.addAll([
        './index.html',
        './TDS Logo no background.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});