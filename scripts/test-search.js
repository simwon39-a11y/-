const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            NOT: { temple: null }
        },
        select: { name: true, temple: true }
    });

    console.log('--- 사찰 정보 목록 (상위 10개) ---');
    users.slice(0, 10).forEach(u => {
        console.log(`이름: ${u.name} | 사찰: [${u.temple}]`);
    });

    // 만약 사찰 정보가 있다면, 그 중 하나로 검색 테스트 수행
    if (users.length > 0) {
        const testTemple = users[0].temple;
        console.log(`\n--- 테스트 검색어: "${testTemple}" ---`);

        const results = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: testTemple, mode: 'insensitive' } },
                    { buddhistName: { contains: testTemple, mode: 'insensitive' } },
                    { temple: { contains: testTemple, mode: 'insensitive' } },
                    { templePosition: { contains: testTemple, mode: 'insensitive' } },
                    { division: { contains: testTemple, mode: 'insensitive' } },
                    { position: { contains: testTemple, mode: 'insensitive' } }
                ]
            }
        });

        console.log(`검색 결과 개수: ${results.length}`);
        results.forEach(r => console.log(` - 검색된 사람 이름: ${r.name}`));
    } else {
        console.log('사찰이 등록된 회원이 없습니다!');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
