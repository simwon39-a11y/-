
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser() {
    console.log('--- 송대관 회원 검색 시작 ---');

    // 1. 정확한 이름으로 검색
    const exactMatch = await prisma.user.findMany({
        where: { name: '송대관' }
    });
    console.log('이름(정확히 일치):', exactMatch.length, '명 찾음');
    exactMatch.forEach(u => console.log(`ID: ${u.id}, 이름: ${u.name}, 전화: ${u.phone}`));

    // 2. 이름에 포함된 경우로 검색
    const partialMatch = await prisma.user.findMany({
        where: { name: { contains: '송' } }
    });
    console.log('이름("송" 포함):', partialMatch.length, '명 찾음');
    partialMatch.forEach(u => console.log(`ID: ${u.id}, 이름: ${u.name}, 전화: ${u.phone}`));

    // 3. 최근 등록된 회원 5명 확인 (업로드 성공 여부 체크)
    const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('--- 최근 등록된 회원 5명 ---');
    recentUsers.forEach(u => console.log(`ID: ${u.id}, 이름: ${u.name}, 전화: ${u.phone}, 등록일: ${u.createdAt}`));

    await prisma.$disconnect();
}

findUser();
