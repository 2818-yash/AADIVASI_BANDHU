const CACHE_NAME = "adivasi-cache-v1";
const urlsToCache = [
  "/",              // homepage
  // add more URLs if you want to cache specific pages
];

// Install event – cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event – try cache first, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
