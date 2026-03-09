'use client';

import { useEffect, useState } from 'react';

export default function BadgeHandler() {
    const [unreadCount, setUnreadCount] = useState(0);

    const updateBadge = async () => {
        try {
            const res = await fetch('/api/unread');
            const data = await res.json();

            if (data.totalUnread !== undefined) {
                const count = data.totalUnread;
                setUnreadCount(count);

                if ('setAppBadge' in navigator) {
                    if (count > 0) {
                        (navigator as any).setAppBadge(count).catch((err: any) => {
                            console.error('Set badge error:', err);
                        });
                    } else {
                        (navigator as any).clearAppBadge().catch((err: any) => {
                            console.error('Clear badge error:', err);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    useEffect(() => {
        updateBadge();

        // 30초마다 주기적으로 배지 업데이트
        const interval = setInterval(updateBadge, 30000);

        // 푸시 알림 수신 시 배지 갱신을 위해 포커스 이벤트 활용
        window.addEventListener('focus', updateBadge);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', updateBadge);
        };
    }, []);

    // 화면에 숫자를 작게 표시할 수도 있습니다 (옵션)
    if (unreadCount === 0) return null;

    return null; // 배지는 아이콘에 표시되므로 여기선 아무것도 렌더링하지 않거나, 대시보드 UI에 작게 표시할 수 있음
}
