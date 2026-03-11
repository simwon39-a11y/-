'use server';

import { sendPushNotification } from '@/lib/push';
import { getServerUser } from '@/lib/auth';

export async function sendTestPushAction() {
    const user = await getServerUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    try {
        const result = await sendPushNotification(
            user.id,
            '🔔 테스트 알림',
            '아이콘 숫자가 생겼는지 확인해 보세요! (테스트 배지: 7)',
            '/dashboard',
            7
        );
        if (result) {
            const errorMsg = result.lastError ? `\n(오류사유: ${result.lastError})` : '';
            return {
                success: true,
                message: `테스트 푸시를 보냈습니다. (발송대상: ${result.total}대, 성공: ${result.success}대)${errorMsg}`
            };
        }


    } catch (error) {
        console.error('Test push error:', error);
        return { success: false, message: '푸시 전송 중 오류가 발생했습니다.' };
    }
}

export async function clearAllSubscriptionsAction() {
    const user = await getServerUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    const { supabase } = await import('@/lib/supabase');

    try {
        const { error } = await supabase
            .from('PushSubscription')
            .delete()
            .eq('userId', user.id);

        if (error) throw error;
        return { success: true, message: '구독 정보가 모두 초기화되었습니다.' };
    } catch (err) {
        console.error('Clear subscriptions error:', err);
        return { success: false, message: '초기화 실패: ' + err };
    }
}

