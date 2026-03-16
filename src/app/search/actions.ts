'use server';

import db from '@/lib/db';

/**
 * 검색어를 입력받아 회원을 찾아주는 작업입니다.
 */
export async function searchMembersAction(query: string) {
    const where: any = {};

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { buddhistName: { contains: query, mode: 'insensitive' } },
            { temple: { contains: query, mode: 'insensitive' } },
            { position: { contains: query, mode: 'insensitive' } },
            { templePosition: { contains: query, mode: 'insensitive' } },
            { division: { contains: query, mode: 'insensitive' } }
        ];
    } else {
        // 쿼리가 없는 경우 검색 결과를 반환하지 않음
        return [];
    }

    const members = await db.user.findMany({
        where,
        orderBy: {
            name: 'asc'
        }
    });

    return members;
}
