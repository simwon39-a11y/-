self.addEventListener('push', function (event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-512x512.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title, options),
            // 백그라운드에서 읽지 않은 수 가져와 배지 갱신 시도
            fetch('/api/unread')
                .then(res => res.json())
                .then(unreadData => {
                    if (unreadData.totalUnread !== undefined && 'setAppBadge' in navigator) {
                        return (navigator as any).setAppBadge(unreadData.totalUnread);
                    }
                }).catch(err => console.error('SW badge error:', err))
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
    // 지금은 네트워크에서 직접 가져오도록 설정하지만, 
    // 핸들러가 존재하는 것만으로도 PWA 설치 조건을 충족합니다.
});

