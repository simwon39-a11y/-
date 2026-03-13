'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

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

    // 진단을 위해 첫 번째 줄의 키(헤더)들을 로그 파일로 남깁니다.
    if (data.length > 0) {
        const firstRowKeys = Object.keys(data[0] as object);
        const logContent = `[${new Date().toISOString()}] 업로드 시도\n파일: ${file.name}\n데이터 개수: ${data.length}\n감지된 헤더: ${JSON.stringify(firstRowKeys)}\n---\n`;
        fs.appendFileSync(path.join(process.cwd(), 'upload_debug.log'), logContent);
    } else {
        fs.appendFileSync(path.join(process.cwd(), 'upload_debug.log'), `[${new Date().toISOString()}] 데이터 없음\n`);
    }

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

        // 유연한 매핑 함수: 키 목록 중 검색어가 포함된 첫 번째 값을 찾습니다.
        const findValue = (keywords: string[]) => {
            const key = Object.keys(normalizedRow).find(k =>
                keywords.some(kw => k.includes(kw))
            );
            return key ? normalizedRow[key] : '';
        };

        const name = findValue(['성명', '성함', '이름']);
        const phone = findValue(['핸드폰', '전화번호', '연락처', '휴대폰', '번호']);
        const buddhistName = findValue(['법명', '불명']);
        const buddhistTitle = findValue(['법호']);
        const buddhistRank = findValue(['법계']);
        const status = findValue(['신분', '구분']);
        const position = findValue(['직책']);
        const temple = findValue(['소속사찰', '사찰', '사찰명']);
        const templePosition = findValue(['사찰직위', '소속사찰 직위']);
        const postalCode = findValue(['우편번호']);
        const templeAddress = findValue(['사찰주소', '주소']);

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

    return {
        success: true,
        count: savedCount,
        detectedHeaders: data.length > 0 ? Object.keys(data[0] as object) : []
    };
}
