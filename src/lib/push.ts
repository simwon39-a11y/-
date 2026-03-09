import webpush from 'web-push';
import db from './db';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidMailto = process.env.VAPID_MAILTO!;

webpush.setVapidDetails(
    vapidMailto,
    vapidPublicKey,
    vapidPrivateKey
);

/**
 * 특정 사용자에게 푸시 알림을 보냅니다.
 */
export async function sendPushNotification(userId: number, title: string, body: string, url: string = '/') {
    // 사용자의 모든 구독 정보를 가져옵니다.
    const subscriptions = await (db as any).pushSubscription.findMany({
        where: { userId }
    });

    const notifications = (subscriptions as any[]).map(sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        };

        return webpush.sendNotification(
            pushSubscription,
            JSON.stringify({ title, body, url })
        ).catch(async (err: any) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
                // 만료된 구독 정보 삭제
                await (db as any).pushSubscription.delete({ where: { id: sub.id } });
            }
            console.error('Push notification error:', err);
        });
    });


    await Promise.all(notifications);
}
