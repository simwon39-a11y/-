
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

async function createTemplate() {
    const data = [
        {
            "성명": "해당되는 이름을 적어주세요",
            "핸드폰": "010-0000-0000",
            "법명": "심원",
            "법호": "정연",
            "법계": "전교",
            "신분": "전법사",
            "직책": "총무부장",
            "소속사찰": "수도사",
            "소속사찰직위": "주지",
            "우편번호": "12345",
            "사찰주소": "수원시 장안구..."
        },
        {
            "성명": "송대관",
            "핸드폰": "010-1111-2222",
            "법명": "아",
            "법호": "아하",
            "법계": "대장",
            "신분": "비구니",
            "직책": "",
            "소속사찰": "수도사",
            "소속사찰직위": "",
            "우편번호": "",
            "사찰주소": "수원시 장안구..."
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "회원명단");

    const paths = [
        path.join('g:', 'WORK', '개발 모음', 'buddhist-member-mgmt', 'public', 'member_template.xlsx'),
        path.join('g:', 'WORK', '개발 모음', 'buddhist-member-mgmt', '종무관리', 'public', 'member_template.xlsx')
    ];

    paths.forEach(p => {
        XLSX.writeFile(workbook, p);
        console.log('Template updated at:', p);
    });
}

createTemplate();
