const XLSX = require('xlsx');
const fs = require('fs');

function findValue(rowObj, keywords) {
    const foundKey = Object.keys(rowObj).find(k =>
        keywords.some(kw => k.includes(kw) || kw.includes(k))
    );
    return foundKey ? rowObj[foundKey] : null;
}

function testParser() {
    // 1. Mock Upload Layout Row (사용자가 올렸을 가상의 데이터 파싱 모델)
    const mockRow = {
        '이름': '김정구',
        '전화번호': '01012345678',
        '법명': '선덕',
        '법호 / 법계': '등 / 계',
        '신분 / 직책': '스님 / 주지',
        '소속사찰': '새로운사찰',
        '소속사찰 직위': '감사',
        '분회': '용인시',
        '사찰주소': '서울시..'
    };

    const normalizedRow = {};
    Object.keys(mockRow).forEach(key => {
        const cleanKey = key.toString().replace(/\s/g, '').trim();
        normalizedRow[cleanKey] = String(mockRow[key]).trim();
    });

    console.log('--- 정규화된 키 목록 ---');
    console.log(Object.keys(normalizedRow));

    const currentData = {
        name: findValue(normalizedRow, ['성명', '이름']),
        temple: findValue(normalizedRow, ['소속사찰', '사찰명', '사찰']),
        templePosition: findValue(normalizedRow, ['소속사찰직위', '소속분회', '분회']),
        division: findValue(normalizedRow, ['분회'])
    };

    console.log('\n--- 가공된 데이터 (currentData) ---');
    console.log(currentData);
}

testParser();
