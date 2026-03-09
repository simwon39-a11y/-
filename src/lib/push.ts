import webpush from 'web-push';
import db from './db';
import { getUnreadCounts } from './unread';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidMailto,
        vapidPublicKey,
        vapidPrivateKey
    );
}


/**
 * 특정 사용자에게 푸시 알림을 보냅니다.
 */
export async function sendPushNotification(userId: number, title: string, body: string, url: string = '/') {
    // 사용자의 모든 구독 정보를 가져옵니다.
    const subscriptions = await (db as any).pushSubscription.findMany({
        where: { userId }
    });

    if (subscriptions.length === 0) return;

    // 해당 사용자의 최신 읽지 않은 수도 함께 보냅니다.
    const unread = await getUnreadCounts(userId);

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
            JSON.stringify({ title, body, url, badge: unread.totalUnread })
        ).catch(async (err: any) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
                // 만료된 구독 정보 삭제
                await (db as any).pushSubscription.delete({ where: { id: sub.id } });
            }
            console.error('Push notification error:', err);
        });
    });


    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r !== undefined).length;
    return {
        total: subscriptions.length,
        success: successCount
    };
}


/**
 * 모든 구독자에게 푸시 알림을 보냅니다.
 */
export async function sendGlobalPushNotification(title: string, body: string, url: string = '/', exceptUserId?: number) {
    const subscriptions = await (db as any).pushSubscription.findMany({
        where: exceptUserId ? { userId: { not: exceptUserId } } : {}
    });

    // 사용자별로 캐싱하여 중복 계산 방지
    const userBadgeCache: { [userId: number]: number } = {};

    const notifications = (subscriptions as any[]).map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        };

        // 이 구독자의 읽지 않은 수 가져오기 (캐시 활용)
        if (userBadgeCache[sub.userId] === undefined) {
            const unread = await getUnreadCounts(sub.userId);
            userBadgeCache[sub.userId] = unread.totalUnread;
        }

        return webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
                title,
                body,
                url,
                badge: userBadgeCache[sub.userId]
            })
        ).catch(async (err: any) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
                await (db as any).pushSubscription.delete({ where: { id: sub.id } });
            }
            console.error('Global Push notification error:', err);
        });
    });

    await Promise.all(notifications);
}


