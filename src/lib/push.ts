import webpush from 'web-push';
import db from './db';
import { getUnreadCounts } from './unread';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    'BJRBZ0FKFSixD5QLvuhB-9L3W11mDrUFqbpK3srg_Oyxq7f8ORFimfGbD0UiCX9fCPEwez-By3I3_RacJIGVFj4';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ||
    'E8Dz80lRrPKPCT-g0jBXjTok8g4TgenE3ZKXFVZj5Vw';
const vapidMailto = process.env.VAPID_MAILTO || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
    try {
        webpush.setVapidDetails(
            vapidMailto,
            vapidPublicKey,
            vapidPrivateKey
        );
    } catch (err) {
        console.error('VAPID initialization error:', err);
    }
}



/**
 * 특정 사용자에게 푸시 알림을 보냅니다.
 */
export async function sendPushNotification(userId: number, title: string, body: string, url: string = '/', badgeOverride?: number) {
    // 사용자의 모든 구독 정보를 가져옵니다.
    const subscriptions = await (db as any).pushSubscription.findMany({
        where: { userId }
    });

    if (subscriptions.length === 0) return;

    // 해당 사용자의 최신 읽지 않은 수도 함께 보냅니다.
    const unread = await getUnreadCounts(userId);
    const badgeCount = badgeOverride !== undefined ? badgeOverride : unread.totalUnread;

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
            JSON.stringify({ title, body, url, badge: badgeCount, badgeCount: badgeCount })
        ).catch(async (err: any) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
                // 만료된 구독 정보 삭제
                await (db as any).pushSubscription.delete({ where: { id: sub.id } });
            }
            console.error('Push notification error:', err);
            return `Error(${err.statusCode}): ${err.message || 'Unknown'}`;
        });

    });


    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r !== undefined).length;
    let lastError = '';

    // 실패한 항목 중 마지막 에러 메시지 추출
    for (const res of results) {
        if (typeof res === 'string') {
            lastError = res;
        }
    }

    return {
        total: subscriptions.length,
        success: successCount,
        lastError
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
                badge: userBadgeCache[sub.userId],
                badgeCount: userBadgeCache[sub.userId]
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


