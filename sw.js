const CACHE_NAME = 'quotation-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/industry-templates.js',
  '/js/pwa.js',
  '/manifest.json'
];

// 安裝Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 擷取請求並回傳快取或網路資源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 回傳快取資源或從網路擷取
        return response || fetch(event.request);
      })
  );
});
