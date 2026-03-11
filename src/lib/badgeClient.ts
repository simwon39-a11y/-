/**
 * 클라이언트 사이드에서 앱 아이콘 배지(숫자)를 최신 상태로 갱신합니다.
 * 서버의 읽지 않은 개수를 가져와서 실제 기기 아이콘에 반영합니다.
 */
export async function refreshAppBadge() {
    if (typeof window === 'undefined' || !('navigator' in window)) return;

    try {
        const res = await fetch(`/api/unread?t=${Date.now()}`, { credentials: 'include' });
        if (!res.ok) {
            console.warn('[Badge] API request failed:', res.status);
            return;
        }

        const data = await res.json();
        const totalUnread = data.totalUnread || 0;

        if ('setAppBadge' in navigator) {
            if (totalUnread > 0) {
                await (navigator as any).setAppBadge(totalUnread);
                console.log(`[Badge] Updated to ${totalUnread}`);
            } else {
                await (navigator as any).clearAppBadge();
                console.log('[Badge] Cleared');

                // 삼성 폰 등 알림 개수와 배지가 연동되는 기기를 위해 
                // 전체 읽지 않은 숫자가 0이면 상단 알림창도 함께 청소합니다.
                if ('serviceWorker' in navigator) {
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const reg of registrations) {
                            const notifications = await reg.getNotifications();
                            notifications.forEach(n => n.close());
                        }
                    } catch (swErr) {
                        console.warn('[Badge] Failed to clear notifications:', swErr);
                    }
                }
            }
        } else {
            console.warn('[Badge] setAppBadge not supported in this browser');
        }
    } catch (err) {
        console.error('[Badge] Failed to refresh app badge:', err);
    }
}
