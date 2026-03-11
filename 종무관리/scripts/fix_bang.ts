import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 방영숙 회원 데이터 수정 (사용자가 알려준 정보 반영)
    const updated = await prisma.user.update({
        where: { phone: '01052824103' },
        data: {
            buddhistName: '진화',
            temple: '등고사',
            templeAddress: '화성시 팔탄면'
            // 기존 position "재무부장"은 유지
        }
    });
    console.log('--- UPDATED DATA ---');
    console.log(JSON.stringify(updated, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
