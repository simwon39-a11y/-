import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
    const csvFilePath = 'g:/WORK/개발 모음/회원관리.csv';

    if (!fs.existsSync(csvFilePath)) {
        console.error(`File not found: ${csvFilePath}`);
        return;
    }

    console.log(`Reading CSV file with CP949 encoding: ${csvFilePath}`);

    // Read the file as a buffer to handle encoding
    const buffer = fs.readFileSync(csvFilePath);

    // Use xlsx with codepage 949 for EUC-KR/CP949 support
    const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 949 });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`Successfully read ${data.length} rows.`);

    let processedCount = 0;

    for (const row of data) {
        // Map the keys exactly as they appear in the parsed data (CP949 labels)
        const name = row['성명']?.toString().trim();
        const phone = row['핸드폰']?.toString().trim().replace(/[^0-9]/g, '');

        if (!name || !phone) {
            continue;
        }

        const buddhistName = row['법명']?.toString().trim();
        const buddhistTitle = row['법호']?.toString().trim();
        const buddhistRank = row['법계']?.toString().trim();
        const temple = row['소속사찰']?.toString().trim();
        const templeAddress = row['사찰주소']?.toString().trim();
        const postalCode = row['우편번호']?.toString().trim();
        const templePosition = row['소속사찰 직위']?.toString().trim();
        const position = row['직책']?.toString().trim();
        const status = row['신분']?.toString().trim();

        try {
            await prisma.user.upsert({
                where: { phone },
                update: {
                    name,
                    buddhistName,
                    buddhistTitle,
                    buddhistRank,
                    temple,
                    templeAddress,
                    postalCode,
                    templePosition,
                    position,
                    status,
                },
                create: {
                    name,
                    phone,
                    buddhistName,
                    buddhistTitle,
                    buddhistRank,
                    temple,
                    templeAddress,
                    postalCode,
                    templePosition,
                    position,
                    status,
                },
            });
            processedCount++;
        } catch (error) {
            console.error(`Error processing row for ${name} (${phone}):`, error);
        }
    }

    console.log('--- Import Result ---');
    console.log(`Total processed (created/updated): ${processedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
