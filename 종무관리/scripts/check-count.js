const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, phone: true }
    });

    let output = `\n========================================\n`;
    output += `Total users in DB: ${users.length} 명\n`;
    output += `========================================\n\n`;

    users.forEach(u => {
        output += `이름: ${u.name.padEnd(10, ' ')} | 전화번호: ${u.phone}\n`;
    });

    fs.writeFileSync('output.txt', output, 'utf8');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
