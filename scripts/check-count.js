const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, phone: true }
    });

    console.log(`\n========================================`);
    console.log(`Total users in DB: ${users.length} 명`);
    console.log(`========================================\n`);

    users.forEach(u => {
        console.log(`이름: ${u.name.padEnd(10, ' ')} | 전화번호: ${u.phone}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
