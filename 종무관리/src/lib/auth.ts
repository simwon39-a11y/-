import { cookies } from 'next/headers';

/**
 * 서버 사이드에서 현재 로그인된 사용자의 정보를 가져오는 유틸리티입니다.
 */
export async function getServerUser() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');

    if (userCookie) {
        try {
            return JSON.parse(userCookie.value);
        } catch (e) {
            return null;
        }
    }

    return null;
}
