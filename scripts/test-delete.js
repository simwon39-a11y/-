const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDelete() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, name: true, phone: true } });
        console.log(`현재 총 회원 수: ${users.length}명`);

        // 임시로 '가짜번호' 하나를 보호 배열로 삼아서, 송대관이 거기에 포함되어 있지 않다면 지워지는가?
        // 다만 실제 삭제는 무서우니 삭제를 시뮬레이션(findMany notIn) 해봅니다.
        const protectedNumbers = ['01099999999']; // 엑셀에서 올라온 유일한 1명이라고 가정

        const targetsToDelete = await prisma.user.findMany({
            where: {
                phone: {
                    notIn: protectedNumbers
                }
            }
        });

        console.log(`\n삭제 대상(notIn) 필터링 결과: ${targetsToDelete.length}명 발견 (보호되지 않은 사람 수)`);

        const songInTargets = targetsToDelete.find(u => u.name.includes('송대관'));
        if (songInTargets) {
            console.log(`-> 송대관(phone: ${songInTargets.phone})도 정상적으로 삭제 대상에 포함됩니다!`);
        } else {
            console.log(`-> 오류: 삭제 대상에 송대관이 없습니다!`);
        }

    } catch (e) {
        console.error('에러 발생:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testDelete();
