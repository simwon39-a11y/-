'use server';

import db from '@/lib/db';
import { getServerUser } from '@/lib/auth';

/**
 * 특정 카테고리의 게시판을 확인했음을 기록합니다.
 */
export async function trackBoardViewAction(category: 'NOTICE' | 'RESOURCE' | 'FREE') {
    const user = await getServerUser();
    if (!user) return { success: false };

    const field = category === 'NOTICE' ? 'lastNoticeViewAt' :
        category === 'RESOURCE' ? 'lastResourceViewAt' : 'lastFreeViewAt';

    await db.user.update({
        where: { id: user.id },
        data: {
            [field]: new Date()
        }
    });

    return { success: true };
}

/**
 * 채팅방의 모든 메시지를 읽음 처리합니다.
 */
export async function markChatAsReadAction(senderId: number) {
    const user = await getServerUser();
    if (!user) return { success: false };

    await db.message.updateMany({
        where: {
            receiverId: user.id,
            senderId: senderId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });

    return { success: true };
}
