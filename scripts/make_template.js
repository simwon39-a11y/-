
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

async function createTemplate() {
    const data = [
        { "성명": "해당되는 이름을 적어주세요", "핸드폰": "010-0000-0000", "법명": "", "소속사찰": "" },
        { "성명": "송대관", "핸드폰": "010-1111-2222", "법명": "아", "소속사찰": "수도사" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "회원명단");

    // 루트 public과 종무관리 public 모두에 생성
    const paths = [
        path.join('g:', 'WORK', '개발 모음', 'buddhist-member-mgmt', 'public', 'member_template.xlsx'),
        path.join('g:', 'WORK', '개발 모음', 'buddhist-member-mgmt', '종무관리', 'public', 'member_template.xlsx')
    ];

    paths.forEach(p => {
        XLSX.writeFile(workbook, p);
        console.log('Template created at:', p);
    });
}

createTemplate();
