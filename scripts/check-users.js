
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log('--- Recent Users ---');
    users.forEach(u => {
        console.log(`Name: ${u.name}, Phone: ${u.phone}, Buddhist: ${u.buddhistName}, Rank: ${u.buddhistRank}, Position: ${u.position}`);
    });
}

checkUsers()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
