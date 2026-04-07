import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING PHONE ZERO REPAIR ---');
    const users = await prisma.user.findMany();
    let fixCount = 0;

    for (const user of users) {
        const phone = user.phone;
        if (!phone.startsWith('0') && phone.length >= 9 && phone.length <= 10) {
            const newPhone = '0' + phone;
            console.log(`Fixing User ID ${user.id} (${user.name}): ${phone} -> ${newPhone}`);

            try {
                // 중복 전화번호 에러 방지 (업데이트 하려는 번호가 이미 존재하는지 체크)
                const existing = await prisma.user.findUnique({ where: { phone: newPhone } });
                if (existing) {
                    console.warn(`[WARN] Skipping ID ${user.id}: ${newPhone} already exists on user ${existing.id}`);
                    continue;
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: { phone: newPhone }
                });
                fixCount++;
            } catch (e) {
                console.error(`[ERROR] Failed to update user ID ${user.id}:`, e);
            }
        }
    }
    console.log('--- REPAIR STATS ---');
    console.log(`Total users fixed: ${fixCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
