const CACHE_NAME = 'quotation-system-v1';
const urlsToCache = [
  '/quotation-system/',
  '/quotation-system/index.html',
  '/quotation-system/css/style.css',
  '/quotation-system/js/main.js',
  '/quotation-system/js/industry-templates.js',
  '/quotation-system/js/pwa.js',
  '/quotation-system/manifest.json'
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
  // 只處理同源請求且在 quotation-system 路徑下的資源
  if (event.request.url.includes('/quotation-system/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 回傳快取資源或從網路擷取
          return response || fetch(event.request);
        })
    );
  }
});