const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: '수원' } },
                { temple: { contains: '수원' } },
                { name: { contains: '송대관' } }, // Previously added user
                { templeAddress: { contains: '수원' } }
            ]
        }
    });

    console.log('Search Results:');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Temple: ${u.temple}, Address: "${u.templeAddress}"`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
