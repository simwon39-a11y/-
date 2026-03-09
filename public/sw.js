// Version: 26.03.09.1810
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

    const notificationPromise = self.registration.showNotification(data.title, options);

    // 배지 업데이트 로직
    let badgePromise;
    if (data.badge !== undefined && 'setAppBadge' in self.navigator) {
        // 푸시 데이터에 배지 정보가 있으면 즉시 적용
        badgePromise = self.navigator.setAppBadge(data.badge);
    } else {
        // 없으면 서버에 물어보기 (폴백)
        badgePromise = fetch('/api/unread', { credentials: 'include' })
            .then(res => res.json())
            .then(unreadData => {
                if (unreadData.totalUnread !== undefined && 'setAppBadge' in self.navigator) {
                    return self.navigator.setAppBadge(unreadData.totalUnread);
                }
            }).catch(err => console.error('SW badge error:', err));
    }

    event.waitUntil(
        Promise.all([
            notificationPromise,
            badgePromise
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

