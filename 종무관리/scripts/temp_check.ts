import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: '방영숙' } },
                { phone: { contains: '5282' } }
            ]
        }
    });
    console.log('--- USER DATA START ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- USER DATA END ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
