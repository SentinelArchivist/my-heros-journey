// sw.js - very basic for installability and minimal offline
const CACHE_NAME = 'my-hero-v1'; // Consider incrementing cache name to v2 after these changes to force update
const urlsToCache = [
  './', // Represents the root of the current directory (e.g., /my-heros-journey/)
  './index.html',
  './style.css',
  './app.js',
  './boss.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request); // Fetch from network
      })
  );
});
