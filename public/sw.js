// Version: 26.03.11.1936

self.addEventListener('push', function (event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png', // 알림 배지 아이콘 (이미지 경로)
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    // 알림 표시를 먼저 실행 (일부 모바일 OS는 알림이 있어야 배지 수정을 허용함)
    const showNotificationPromise = self.registration.showNotification(data.title, options);

    // 배지 업데이트 로직 (앱 아이콘 숫자)
    const updateBadgePromise = (async () => {
        try {
            if ('setAppBadge' in self.navigator) {
                // badgeCount 필드가 있으면 우선 사용, 없으면 badge 필드(하위 호환) 확인
                const rawBadge = data.badgeCount !== undefined ? data.badgeCount : data.badge;

                if (rawBadge !== undefined) {
                    const count = parseInt(rawBadge, 10);
                    if (!isNaN(count)) {
                        await self.navigator.setAppBadge(count);
                    }
                } else {
                    // 서버에서 다시 가져오기
                    const res = await fetch('/api/unread', { credentials: 'include' });
                    const unreadData = await res.json();
                    if (unreadData.totalUnread !== undefined) {
                        const count = parseInt(unreadData.totalUnread, 10);
                        if (!isNaN(count)) {
                            await self.navigator.setAppBadge(count);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Badge update error:', err);
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
    // 지금은 네트워크에서 직접 가져오도록 설정하지만, 
    // 핸들러가 존재하는 것만으로도 PWA 설치 조건을 충족합니다.
});

