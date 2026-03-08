import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- SAMPLE DATA (10 USERS) ---');
    const users = await prisma.user.findMany({
        take: 10,
        orderBy: { id: 'asc' }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
