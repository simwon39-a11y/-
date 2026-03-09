'use server';

import { sendPushNotification } from '@/lib/push';
import { getServerUser } from '@/lib/auth';

export async function sendTestPushAction() {
    const user = await getServerUser();
    if (!user) return { success: false, message: '로그인이 필요합니다.' };

    try {
        await sendPushNotification(
            user.id,
            '🔔 테스트 알림',
            '아이콘 숫자가 생겼는지 확인해 보세요! (테스트 배지: 7)',
            '/dashboard'
        );
        return { success: true, message: '테스트 푸시를 보냈습니다.' };
    } catch (error) {
        console.error('Test push error:', error);
        return { success: false, message: '푸시 전송 중 오류가 발생했습니다.' };
    }
}
