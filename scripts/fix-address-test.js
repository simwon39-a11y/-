const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.user.update({
        where: { id: 23 }, // 송대관
        data: {
            templeAddress: '수원시 장안구 이목동283-1번지'
        }
    });

    console.log('Update Successful:');
    console.log(`ID: ${updated.id}, Name: ${updated.name}, Address: "${updated.templeAddress}"`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
