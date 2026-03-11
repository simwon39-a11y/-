import { supabase } from './supabase';

/**
 * 특정 사용자의 읽지 않은 총합 및 상세 정보를 가져옵니다.
 * Prisma 대신 Supabase SDK(fetch)를 사용하여 연결 오버헤드를 줄입니다.
 */
export async function getUnreadCounts(userId: number) {
    const totalStart = performance.now();

    try {
        const [userDataRes, unreadMessagesRes, pushCountRes] = await Promise.all([
            supabase.from('User').select('lastNoticeViewAt, lastResourceViewAt, lastFreeViewAt').eq('id', userId).single(),
            supabase.from('Message').select('*', { count: 'exact', head: true }).eq('receiverId', userId).eq('isRead', false),
            supabase.from('PushSubscription').select('*', { count: 'exact', head: true }).eq('userId', userId)
        ]);

        if (userDataRes.error || !userDataRes.data) {
            console.error('[UNREAD] User data not found for id:', userId);
            return { totalUnread: 0, details: { messages: 0, notices: 0, resources: 0, frees: 0 } };
        }

        const userData = userDataRes.data;
        const unreadMessages = unreadMessagesRes.count || 0;

        // DB에서 가져온 시간을 명시적으로 보장 (문자열인 경우 그대로, Date 객체인 경우 ISO로)
        const lastN = userData.lastNoticeViewAt;
        const lastR = userData.lastResourceViewAt;
        const lastF = userData.lastFreeViewAt;

        const [noticesRes, resourcesRes, freesRes] = await Promise.all([
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'NOTICE').gt('createdAt', lastN),
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'RESOURCE').gt('createdAt', lastR),
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'FREE').gt('createdAt', lastF)
        ]);

        const unreadNotices = noticesRes.count || 0;
        const unreadResources = resourcesRes.count || 0;
        const unreadFrees = freesRes.count || 0;

        const totalUnread = unreadMessages + unreadNotices + unreadResources + unreadFrees;

        console.log(`[UNREAD] User:${userId} -> Msg:${unreadMessages}, N:${unreadNotices}, R:${unreadResources}, F:${unreadFrees} (Total:${totalUnread})`);

        return {
            totalUnread,
            pushCount: pushCountRes.count || 0,
            details: {
                messages: unreadMessages,
                notices: unreadNotices,
                resources: unreadResources,
                frees: unreadFrees
            }
        };
    } catch (error) {
        console.error('[UNREAD ERROR]:', error);
        throw error;
    }
}
