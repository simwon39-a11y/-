const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const filePath = 'g:/WORK/개발 모음/회원명단.xlsx';
    console.log('Reading file:', filePath);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows.`);

    let count = 0;
    for (const row of data) {
        const name = row['성명'];
        const phone = row['핸드폰'];
        const buddhistName = row['법명'] || row['신분'] || ''; // '신분'도 법명으로 간주
        const position = row['직책'] || '';

        if (name && phone) {
            const cleanPhone = String(phone).replace(/-/g, '');

            // buddhistName 필드가 아직 Client에 반영되지 않았을 경우를 대비한 동적 쿼리
            const dataToUpdate = {
                name: String(name),
                position: String(position)
            };

            // buddhistName 필드가 있으면 추가
            if (prisma.user.fields && 'buddhistName' in prisma.user.fields) {
                dataToUpdate.buddhistName = String(buddhistName);
            } else {
                // 필드가 없으면 position에라도 합쳐서 저장 (임시 방편)
                dataToUpdate.position = `${buddhistName} ${position}`.trim();
            }

            await prisma.user.upsert({
                where: { phone: cleanPhone },
                update: dataToUpdate,
                create: {
                    ...dataToUpdate,
                    phone: cleanPhone
                }
            });
            count++;
        }
    }

    console.log(`Successfully processed ${count} members.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
