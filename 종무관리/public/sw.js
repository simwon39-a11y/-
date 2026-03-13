// Version: 2026.03.13.v15.2
const CACHE_NAME = 'buddhist-member-v15.2';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
});
