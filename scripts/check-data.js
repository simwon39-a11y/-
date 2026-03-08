const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 5,
        select: {
            name: true,
            buddhistName: true,
            templeAddress: true,
            phone: true
        }
    });
    console.log('Sample Users:', JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
