import db from './db';

/**
 * 특정 사용자의 읽지 않은 총합 및 상세 정보를 가져옵니다.
 */
export async function getUnreadCounts(userId: number) {
    // 1. 읽지 않은 메시지 수
    const unreadMessages = await (db as any).message.count({
        where: {
            receiverId: userId,
            isRead: false
        }
    });

    // 2. 사용자의 마지막 확인 시간 가져오기
    const userData = await (db as any).user.findUnique({
        where: { id: userId },
        select: {
            lastNoticeViewAt: true,
            lastResourceViewAt: true,
            lastFreeViewAt: true
        }
    });

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

    const totalUnread = unreadMessages + unreadNotices + unreadResources + unreadFrees;

    const pushCount = await (db as any).pushSubscription.count({
        where: { userId }
    });

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

