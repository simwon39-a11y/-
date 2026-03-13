
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function scanNames() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true, phone: true, createdAt: true },
        orderBy: { id: 'desc' },
        take: 30
    });

    console.log('--- 최신 30명 회원 명단 스캔 ---');
    users.forEach(u => {
        // 한글 외의 문자가 포함되었는지 체크 (깨짐 확인용)
        const isBroken = /[^가-힣a-zA-Z0-9\s]/.test(u.name);
        console.log(`[${isBroken ? '깨짐?' : '정상'}] ID: ${u.id}, 이름: ${u.name}, 전화: ${u.phone}, 등록일: ${u.createdAt}`);
    });

    await prisma.$disconnect();
}
scanNames();
