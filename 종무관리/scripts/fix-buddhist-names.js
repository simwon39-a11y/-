const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 사용자로부터 들은 예시와 엑셀 데이터를 바탕으로 수동 보정
    const corrections = [
        { name: '이병일', buddhistName: '심원', position: '총무부장' },
        { name: '김태연', buddhistName: '태연', position: '문화부장' },
        { name: '전희대', buddhistName: '희대', position: '비구니' },
        { name: '이석희', buddhistName: '석희', position: '비구니' },
        { name: '방영숙', buddhistName: '영숙', position: '재무부장' }
    ];

    for (const c of corrections) {
        await prisma.user.updateMany({
            where: { name: c.name },
            data: {
                buddhistName: c.buddhistName,
                position: c.position
            }
        });
    }
    console.log('Data corrections applied successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
