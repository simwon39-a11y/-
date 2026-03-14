// Version: 2026.03.14.v17.1
const CACHE_NAME = 'buddhist-member-v17.1';

self.addEventListener('install', function (event) {
    self.skipWaiting(); // 새 서비스 워커가 발견되는 즉시 대기 없이 설치하게 합니다.
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim()); // 즉시 제어권을 갖게 합니다.
});

self.addEventListener('push', function (event) {
    const data = event.data.json();
    console.log('[SW] Push received:', data);

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    const showNotificationPromise = self.registration.showNotification(data.title, options);

    const updateBadgePromise = (async () => {
        try {
            if ('setAppBadge' in self.navigator) {
                let count = 0;
                if (data.badgeCount !== undefined) {
                    count = parseInt(data.badgeCount, 10);
                } else if (data.badge !== undefined) {
                    count = parseInt(data.badge, 10);
                } else {
                    const res = await fetch(`/api/unread?t=${Date.now()}`, { credentials: 'include' });
                    const unreadData = await res.json();
                    count = parseInt(unreadData.totalUnread, 10);
                }

                if (!isNaN(count)) {
                    if (count > 0) {
                        await self.navigator.setAppBadge(count);
                    } else {
                        await self.navigator.clearAppBadge();
                    }
                }
            }
        } catch (err) {
            console.error('[SW] Badge update error:', err);
        }
    })();

    event.waitUntil(
        Promise.all([
            showNotificationPromise,
            updateBadgePromise
        ])
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// 필수: 서비스 워커 활성화
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// PWA 설치를 위해 반드시 하나 이상의 fetch 핸들러가 필요합니다.
self.addEventListener('fetch', (event) => {
    // 핸들러가 존재하는 것만으로도 PWA 설치 조건을 충족합니다.
});
