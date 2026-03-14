// Version: 2026.03.14.v17
const CACHE_NAME = 'buddhist-member-v17';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
});
