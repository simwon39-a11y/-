// Version: 2026.03.13.v15.4
const CACHE_NAME = 'buddhist-member-v15.4';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
});
