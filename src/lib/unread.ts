import { supabase } from './supabase';

/**
 * 특정 사용자의 읽지 않은 총합 및 상세 정보를 가져옵니다.
 * Prisma 대신 Supabase SDK(fetch)를 사용하여 연결 오버헤드를 줄입니다.
 */
export async function getUnreadCounts(userId: number) {
    const totalStart = performance.now();

    try {
        // 1. 사용자 마지막 확인 시간 및 메시지 카운트 등을 한번에 병렬로 조회
        const [userDataRes, unreadMessagesRes, pushCountRes] = await Promise.all([
            supabase.from('User').select('lastNoticeViewAt, lastResourceViewAt, lastFreeViewAt').eq('id', userId).single(),
            supabase.from('Message').select('*', { count: 'exact', head: true }).eq('receiverId', userId).eq('isRead', false),
            supabase.from('PushSubscription').select('*', { count: 'exact', head: true }).eq('userId', userId)
        ]);

        if (userDataRes.error || !userDataRes.data) {
            return { totalUnread: 0, details: { messages: 0, notices: 0, resources: 0, frees: 0 } };
        }

        const userData = userDataRes.data;
        const unreadMessages = unreadMessagesRes.count || 0;

        // 2. 각 게시판 카테고리별 읽지 않은 수 조회 (병렬)
        const [noticesRes, resourcesRes, freesRes] = await Promise.all([
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'NOTICE').gt('createdAt', userData.lastNoticeViewAt),
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'RESOURCE').gt('createdAt', userData.lastResourceViewAt),
            supabase.from('Post').select('*', { count: 'exact', head: true }).eq('category', 'FREE').gt('createdAt', userData.lastFreeViewAt)
        ]);

        const unreadNotices = noticesRes.count || 0;
        const unreadResources = resourcesRes.count || 0;
        const unreadFrees = freesRes.count || 0;

        const totalUnread = unreadMessages + unreadNotices + unreadResources + unreadFrees;

        console.log(`[PERF-SDK] getUnreadCounts TOTAL: ${Math.round(performance.now() - totalStart)}ms`);

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
        console.error('[PERF ERROR-SDK] getUnreadCounts:', error);
        throw error;
    }
}
