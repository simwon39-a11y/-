import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    });

    console.log('--- 전체 회원 목록 점검 ---');
    const nameGroups: { [key: string]: any[] } = {};

    users.forEach(u => {
        if (!nameGroups[u.name]) nameGroups[u.name] = [];
        nameGroups[u.name].push(u);
    });

    let foundDuplicate = false;
    for (const name in nameGroups) {
        if (nameGroups[name].length > 1) {
            foundDuplicate = true;
            console.log(`\n[중복 의심] 성함: ${name}`);
            nameGroups[name].forEach(u => {
                console.log(`  - ID: ${u.id}, 법명: ${u.buddhistName}, 전화번호: ${u.phone}, 직책: ${u.position}, 사찰: ${u.temple}`);
            });
        }
    }

    if (!foundDuplicate) {
        console.log('성함이 중복된 회원이 없습니다.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
