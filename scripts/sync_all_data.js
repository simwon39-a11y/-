const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const filePath = "g:/WORK/개발 모음/회원관리.csv";
    const buffer = fs.readFileSync(filePath);

    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        codepage: 949
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`총 ${data.length}명의 데이터를 업데이트합니다...`);

    for (const row of data) {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.trim()] = row[key];
        });

        const name = normalizedRow['성명'] || normalizedRow['성함'] || normalizedRow['이름'];
        const phone = normalizedRow['핸드폰'] || normalizedRow['전화번호'] || normalizedRow['연락처'] || normalizedRow['휴대폰'];
        const buddhistName = normalizedRow['법명'] || normalizedRow['불명'] || '';
        const buddhistTitle = normalizedRow['법호'] || '';
        const buddhistRank = normalizedRow['법계'] || '';
        const status = normalizedRow['신분'] || normalizedRow['구분'] || '';
        const position = normalizedRow['직책'] || '';
        const temple = normalizedRow['소속사찰'] || normalizedRow['사찰'] || normalizedRow['사찰명'] || '';
        const templePosition = normalizedRow['소속사찰 직위'] || normalizedRow['사찰직위'] || '';
        const postalCode = normalizedRow['우편번호'] || '';
        const templeAddress = normalizedRow['사찰주소'] || normalizedRow['주소'] || '';

        if (name && phone) {
            const cleanPhone = String(phone).replace(/-/g, '').trim();
            if (cleanPhone.length >= 9) {
                await prisma.user.upsert({
                    where: { phone: cleanPhone },
                    update: {
                        name: String(name).trim(),
                        buddhistName: String(buddhistName).trim(),
                        buddhistTitle: String(buddhistTitle).trim(),
                        buddhistRank: String(buddhistRank).trim(),
                        status: String(status).trim(),
                        position: String(position).trim(),
                        temple: String(temple).trim(),
                        templePosition: String(templePosition).trim(),
                        postalCode: String(postalCode).trim(),
                        templeAddress: String(templeAddress).trim()
                    },
                    create: {
                        name: String(name).trim(),
                        phone: cleanPhone,
                        buddhistName: String(buddhistName).trim(),
                        buddhistTitle: String(buddhistTitle).trim(),
                        buddhistRank: String(buddhistRank).trim(),
                        status: String(status).trim(),
                        position: String(position).trim(),
                        temple: String(temple).trim(),
                        templePosition: String(templePosition).trim(),
                        postalCode: String(postalCode).trim(),
                        templeAddress: String(templeAddress).trim()
                    },
                });
                console.log(`- ${name} (${cleanPhone}) 업데이트 완료`);
            }
        }
    }

    console.log('전체 데이터 업데이트가 완료되었습니다.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
