const CACHE_NAME = 'studypro-v1';
const BASE_URL = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
const urlsToCache = [
  BASE_URL + '/',
  BASE_URL + '/assets/', // This will be dynamically handled
  BASE_URL + '/study-icon.svg',
  BASE_URL + '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache basic resources, assets will be cached on fetch
        return cache.addAll([
          BASE_URL + '/',
          BASE_URL + '/study-icon.svg',
          BASE_URL + '/manifest.json'
        ]);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Cache assets dynamically
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        });
      })
  );
});
