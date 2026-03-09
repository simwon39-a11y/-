'use client';

import { useEffect } from 'react';

/**
 * 사용자가 로그인 상태일 때 브라우저 알림 구독을 자동으로 시도합니다.
 */
export default function PushSubscriptionHandler({ userId }: { userId: number }) {
    useEffect(() => {
        if (!userId) return;

        async function subscribeToPush() {
            try {
                const registration = await navigator.serviceWorker.ready;

                // 브라우저가 알림을 허용했는지 확인
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                // 기존 구독 확인
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // 구독 새로 생성
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
                    });
                }

                // 서버에 구독 정보 전송
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, subscription })
                });

            } catch (error) {
                console.error('Push subscription failed:', error);
            }
        }

        subscribeToPush();
    }, [userId]);

    return null;
}

// VAPID 키 변환 유틸리티
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
