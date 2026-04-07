const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSong() {
    const users = await prisma.user.findMany({
        where: { name: { contains: '송대관' } }
    });
    console.log('--- 송대관 검색 결과 ---');
    console.log(users);

    const allUsers = await prisma.user.findMany({
        select: { phone: true, name: true }
    });
    console.log(`\n총 가입자 수: ${allUsers.length}명`);
}

findSong()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
