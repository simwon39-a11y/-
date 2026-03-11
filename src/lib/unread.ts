import db from './db';

/**
 * 특정 사용자의 읽지 않은 총합 및 상세 정보를 가져옵니다.
 */
export async function getUnreadCounts(userId: number) {
    const totalStart = performance.now();

    // 1. 읽지 않은 메시지 수
    const s1 = performance.now();
    const unreadMessages = await (db as any).message.count({
        where: {
            receiverId: userId,
            isRead: false
        }
    });
    console.log(`[PERF] getUnreadCount - messages: ${Math.round(performance.now() - s1)}ms`);

    // 2. 사용자의 마지막 확인 시간 가져오기
    const s2 = performance.now();
    const userData = await (db as any).user.findUnique({
        where: { id: userId },
        select: {
            lastNoticeViewAt: true,
            lastResourceViewAt: true,
            lastFreeViewAt: true
        }
    });
    console.log(`[PERF] getUnreadCount - user: ${Math.round(performance.now() - s2)}ms`);

    if (!userData) {
        return {
            totalUnread: unreadMessages,
            details: {
                messages: unreadMessages,
                notices: 0,
                resources: 0,
                frees: 0
            }
        };
    }

    // 3. 각 카테고리별 읽지 않은 게시글 수
    const s3 = performance.now();
    const [unreadNotices, unreadResources, unreadFrees] = await Promise.all([
        (db as any).post.count({
            where: {
                category: 'NOTICE',
                createdAt: { gt: (userData as any).lastNoticeViewAt }
            }
        }),
        (db as any).post.count({
            where: {
                category: 'RESOURCE',
                createdAt: { gt: (userData as any).lastResourceViewAt }
            }
        }),
        (db as any).post.count({
            where: {
                category: 'FREE',
                createdAt: { gt: (userData as any).lastFreeViewAt }
            }
        })
    ]);
    console.log(`[PERF] getUnreadCount - categories(3): ${Math.round(performance.now() - s3)}ms`);

    const s4 = performance.now();
    const pushCount = await (db as any).pushSubscription.count({
        where: { userId }
    });
    console.log(`[PERF] getUnreadCount - push: ${Math.round(performance.now() - s4)}ms`);

    const totalUnread = unreadMessages + unreadNotices + unreadResources + unreadFrees;

    const totalEnd = performance.now();
    console.log(`[PERF] getUnreadCounts TOTAL: ${Math.round(totalEnd - totalStart)}ms`);

    return {
        totalUnread,
        pushCount,
        details: {
            messages: unreadMessages,
            notices: unreadNotices,
            resources: unreadResources,
            frees: unreadFrees
        }
    };
}

