'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 */
export async function uploadExcelAction(formData: FormData) {
    try {
        const file = formData.get('excel-file') as File;
        if (!file) {
            return { success: false, message: '파일이 선택되지 않았습니다.', count: 0 };
        }

        // 1. 파일을 읽을 수 있는 데이터로 바꿉니다.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2. XLSX 라이브러리를 사용해 파일을 읽습니다.
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // 3. 첫 번째 시트를 가져옵니다.
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 4. 표 형식으로 된 데이터를 목록으로 바꿉니다.
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log('읽어온 데이터 개수:', data.length);

        // 5. 한 명씩 데이터베이스에 넣습니다.
        const rows = data as any[];
        let savedCount = 0;

        for (const row of rows) {
            // 모든 키의 공백을 제거한 버전으로 맵을 만듭니다.
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toString().trim()] = row[key];
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
            const templeAddress = findValue(['사찰주소', '주소', '거주지']);

            if (name && phone) {
                const cleanPhone = String(phone).replace(/-/g, '').trim();
                // 전화번호가 유효한지 확인 (9자리 이상)
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

        // 화면 갱신
        revalidatePath('/admin/upload');
        revalidatePath('/search');
        revalidatePath('/board');
        revalidatePath('/dashboard');

        return {
            success: true,
            count: savedCount,
            detectedHeaders: data.length > 0 ? Object.keys(data[0] as object) : [],
            message: '데이터 처리를 완료했습니다.'
        };
    } catch (error: any) {
        console.error('업로드 처리 중 오류 발생:', error);
        return {
            success: false,
            message: error.message || '업로드 처리 중 알 수 없는 오류가 발생했습니다.',
            count: 0
        };
    }
}
