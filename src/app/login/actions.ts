'use server';

import db from '@/lib/db';

import { cookies } from 'next/headers';

/**
 * 사용자가 입력한 성함과 전화번호가 우리 창고(DB)에 있는지 확인하는 작업입니다.
 */
export async function loginAction(name: string, phone: string) {
    if (!name || !phone) throw new Error('성함과 전화번호를 모두 입력해 주세요.');

    const cleanPhone = phone.replace(/-/g, '');

    // 창고에서 이름과 전화번호가 일치하는 사람을 찾습니다.
    const user = await db.user.findFirst({
        where: {
            name: name,
            phone: cleanPhone
        }
    });

    if (user) {
        // 찾았다면 성공! 쿠키에 사용자 정보를 저장합니다 (30일 유지)
        const cookieStore = await cookies();
        cookieStore.set('user', JSON.stringify({ id: user.id, name: user.name }), {
            maxAge: 60 * 60 * 24 * 30, // 30일
            path: '/',
            httpOnly: false, // 클라이언트에서도 접근 가능하도록 (기존 로직 호환성 위해)
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return { success: true, user: { id: user.id, name: user.name } };
    } else {
        // 못 찾았다면 실패입니다.
        return { success: false, message: '등록된 회원 정보가 없습니다. 관리자에게 문의해 주세요.' };
    }
}

