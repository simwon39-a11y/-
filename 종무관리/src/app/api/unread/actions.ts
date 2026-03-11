'use server';

import db from '@/lib/db';
import { getServerUser } from '@/lib/auth';

/**
 * 여러 카테고리의 게시판을 확인했음을 한 번에 기록합니다. (네트워크 요청 최적화)
 */
export async function trackMultipleBoardViewsAction(categories: ('NOTICE' | 'RESOURCE' | 'FREE')[]) {
    const user = await getServerUser();
    if (!user || categories.length === 0) return { success: false };

    try {
        const { supabase } = await import('@/lib/supabase');
        const data: any = {};
        const now = new Date().toISOString();

        if (categories.includes('NOTICE')) data.lastNoticeViewAt = now;
        if (categories.includes('RESOURCE')) data.lastResourceViewAt = now;
        if (categories.includes('FREE')) data.lastFreeViewAt = now;

        const { error } = await supabase
            .from('User')
            .update(data)
            .eq('id', user.id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Track board view error:', err);
        return { success: false };
    }
}

/**
 * 특정 카테고리의 게시판을 확인했음을 기록합니다.
 */
export async function trackBoardViewAction(category: 'NOTICE' | 'RESOURCE' | 'FREE') {
    return await trackMultipleBoardViewsAction([category]);
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
