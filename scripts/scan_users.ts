import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST 10 REGISTERED USERS ---');
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, CreatedAt: ${u.createdAt}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
