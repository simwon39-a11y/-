import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log(`총 ${users.length}명의 데이터를 점검합니다...`);

    for (const user of users) {
        const originalPhone = user.phone;
        const normalizedPhone = originalPhone.replace(/-/g, '').trim();

        // 하이픈이 포함된 경우 처리
        if (originalPhone !== normalizedPhone) {
            console.log(`[정리 중] ${user.name}: ${originalPhone} -> ${normalizedPhone}`);

            // 이미 정규화된 번호로 등록된 사람이 있는지 확인
            const existingUser = await prisma.user.findUnique({
                where: { phone: normalizedPhone }
            });

            if (existingUser) {
                // 이미 존재하면 현재(하이픈 있는) 레코드의 데이터를 새 레코드로 옮기고 삭제
                console.log(`  - 중복 발견 (ID: ${existingUser.id}). 데이터 이전 중...`);

                // 1. 게시물 이전
                await prisma.post.updateMany({
                    where: { authorId: user.id },
                    data: { authorId: existingUser.id }
                });

                // 2. 댓글 이전
                await prisma.comment.updateMany({
                    where: { authorId: user.id },
                    data: { authorId: existingUser.id }
                });

                // 3. 메시지 이전 (보낸 것, 받은 것)
                await prisma.message.updateMany({
                    where: { senderId: user.id },
                    data: { senderId: existingUser.id }
                });
                await prisma.message.updateMany({
                    where: { receiverId: user.id },
                    data: { receiverId: existingUser.id }
                });

                // 4. 이제 안전하게 삭제
                console.log(`  - 데이터 이전 완료. 현재 레코드(ID: ${user.id})를 삭제합니다.`);
                await prisma.user.delete({ where: { id: user.id } });
            } else {
                // 존재하지 않으면 현재 레코드의 번호를 정규화된 번호로 업데이트
                console.log(`  - 번호를 정규화된 형식으로 업데이트합니다.`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { phone: normalizedPhone }
                });
            }
        }
    }

    console.log('데이터 정리가 완료되었습니다.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
