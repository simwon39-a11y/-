import { useEffect } from 'react';
import { refreshAppBadge } from '@/lib/badgeClient';

export default function BadgeHandler() {
    useEffect(() => {
        // 즉시 동기화
        refreshAppBadge();

        // 15초마다 주기적으로 배지 업데이트 (성능과 실시간성 절충)
        const interval = setInterval(refreshAppBadge, 15000);

        // 푸시 알림 수신 시 배지 갱신을 위해 포커스 이벤트 활용
        window.addEventListener('focus', refreshAppBadge);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', refreshAppBadge);
        };
    }, []);

    return null;
}
