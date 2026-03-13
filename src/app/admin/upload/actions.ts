'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 * 최적화: Vercel의 10초 제한을 고려하여 타임아웃 방지 및 데이터 처리를 조절합니다.
 */
export async function uploadExcelAction(formData: FormData) {
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8000; // 8초 (Vercel Hobby 10초 기준 안전선)

    try {
        const file = formData.get('excel-file') as File;
        if (!file) {
            return { success: false, message: '파일이 선택되지 않았습니다.', count: 0 };
        }

        // 1. 파일을 읽을 수 있는 데이터로 바꿉니다.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2. XLSX 라이브러리를 사용해 파일을 읽습니다.
        // CSV 파일의 경우 한국어 윈도우 인코딩(CP949)인 경우가 많으므로 인코딩을 지정합니다.
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const workbook = XLSX.read(buffer, {
            type: 'buffer',
            codepage: isCsv ? 949 : undefined
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log(`[시작] 파일: ${file.name}, 총 데이터: ${data.length}건`);

        // 5. 한 명씩 데이터베이스에 넣습니다.
        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        for (const row of rows) {
            // 타임아웃 체크: 8초가 지나면 작업을 멈추고 결과를 반환합니다.
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toString().trim()] = row[key];
            });

            const findValue = (keywords: string[]) => {
                const key = Object.keys(normalizedRow).find(k =>
                    keywords.some(kw => k.includes(kw))
                );
                return key ? normalizedRow[key] : '';
            };

            const name = findValue(['성명', '성함', '이름']);
            const phone = findValue(['핸드폰', '전화번호', '연락처', '휴대폰', '번호']);

            if (name && phone) {
                const cleanPhone = String(phone).replace(/-/g, '').trim();
                if (cleanPhone.length >= 9) {
                    await db.user.upsert({
                        where: { phone: cleanPhone },
                        update: {
                            name: String(name).trim(),
                            buddhistName: String(findValue(['법명', '불명'])).trim(),
                            buddhistTitle: String(findValue(['법호'])).trim(),
                            buddhistRank: String(findValue(['법계'])).trim(),
                            status: String(findValue(['신분', '구분'])).trim(),
                            position: String(findValue(['직책'])).trim(),
                            temple: String(findValue(['소속사찰', '사찰', '사찰명'])).trim(),
                            templePosition: String(findValue(['사찰직위', '소속사찰 직위'])).trim(),
                            postalCode: String(findValue(['우편번호'])).trim(),
                            templeAddress: String(findValue(['사찰주소', '주소', '거주지'])).trim()
                        },
                        create: {
                            name: String(name).trim(),
                            phone: cleanPhone,
                            buddhistName: String(findValue(['법명', '불명'])).trim(),
                            buddhistTitle: String(findValue(['법호'])).trim(),
                            buddhistRank: String(findValue(['법계'])).trim(),
                            status: String(findValue(['신분', '구분'])).trim(),
                            position: String(findValue(['직책'])).trim(),
                            temple: String(findValue(['소속사찰', '사찰', '사찰명'])).trim(),
                            templePosition: String(findValue(['사찰직위', '소속사찰 직위'])).trim(),
                            postalCode: String(findValue(['우편번호'])).trim(),
                            templeAddress: String(findValue(['사찰주소', '주소', '거주지'])).trim()
                        },
                    });
                    savedCount++;
                }
            }
        }

        revalidatePath('/admin/upload');
        revalidatePath('/search');
        revalidatePath('/dashboard');

        return {
            success: true,
            count: savedCount,
            totalInFile: data.length,
            isPartial: isTimedOut,
            detectedHeaders: data.length > 0 ? Object.keys(data[0] as object) : [],
            message: isTimedOut ? `시간 제한(10초)으로 인해 ${savedCount}명만 먼저 등록되었습니다. 남은 인원은 다시 업로드해주세요.` : '모든 데이터 등록을 완료했습니다.'
        };
    } catch (error: any) {
        console.error('업로드 서버 오류:', error);
        return {
            success: false,
            message: `서버 오류: ${error.message || '알 수 없는 에러'}`,
            count: 0
        };
    }
}
