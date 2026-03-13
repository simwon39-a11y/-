'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 * 초보자 설명: 화면에서 파일을 보내면, 여기서 그 파일을 뜯어서 주소록(DB)에 한 명씩 옮겨 적습니다.
 */
export async function uploadExcelAction(formData: FormData) {
    const file = formData.get('excel-file') as File;
    if (!file) throw new Error('파일이 없습니다.');

    // 1. 파일을 읽을 수 있는 데이터로 바꿉니다.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. XLSX 라이브러리를 사용해 파일을 읽습니다.
    // 팁: XLSX는 자동으로 파일 형식을 감지합니다. 
    const workbook = XLSX.read(buffer, {
        type: 'buffer'
    });

    // 3. 첫 번째 시트(쪽)를 가져옵니다.
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 4. 표 형식으로 된 데이터를 목록으로 바꿉니다.
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log('읽어온 데이터 개수:', data.length);

    // 5. 한 명씩 우리 데이터베이스(창고)에 넣습니다.
    const rows = data as any[];
    let savedCount = 0;

    for (const row of rows) {
        // 모든 키를 가져와서 공백을 제거한 버전으로 맵을 만듭니다.
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.trim()] = row[key];
        });

        // '회원관리.csv' 헤더에 정확히 맞춰 매핑합니다.
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
            // 전화번호가 유효한지 확인 (기본적인 체크)
            if (cleanPhone.length >= 9) {
                await db.user.upsert({
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
                savedCount++;
            }
        }
    }

    // 화면을 새로고침해서 바뀐 데이터를 보여주도록 합니다.
    revalidatePath('/admin/upload');
    revalidatePath('/search'); // 검색 페이지도 갱신
    revalidatePath('/board');
    revalidatePath('/dashboard');
    return { success: true, count: savedCount };
}
