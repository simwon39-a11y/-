const XLSX = require('xlsx');
const fs = require('fs');

async function main() {
    const filePath = "g:/WORK/개발 모음/회원관리.csv";
    const buffer = fs.readFileSync(filePath);

    // 업로드 로직과 동일하게 시도
    const workbook = XLSX.read(buffer, {
        type: 'buffer',
        codepage: 949
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log('--- CSV PARSE TEST ---');
    console.log('Row count:', data.length);
    if (data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]));
        console.log('First row data:', JSON.stringify(data[0], null, 2));

        // 정규화 테스트
        const normalizedRow = {};
        Object.keys(data[0]).forEach(key => {
            normalizedRow[key.trim()] = data[0][key];
        });
        console.log('Normalized keys:', Object.keys(normalizedRow));

        const temple = normalizedRow['소속사찰'] || normalizedRow['사찰'] || normalizedRow['사찰명'] || '';
        console.log('Detected temple for first row:', temple);
    }
}

main().catch(console.error);
