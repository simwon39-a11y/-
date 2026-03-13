// Version: 2026.03.13.v16
const CACHE_NAME = 'buddhist-member-v16';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
});
