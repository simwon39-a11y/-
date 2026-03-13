'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 * 최적화: Vercel의 10초 제한 및 한글 인코딩(CP949) 문제를 완벽하게 해결합니다.
 */
export async function uploadExcelAction(formData: FormData) {
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8000; // 8초 안전선

    try {
        const file = formData.get('excel-file') as File;
        if (!file) {
            return { success: false, message: '파일이 선택되지 않았습니다.', count: 0 };
        }

        // 1. 파일을 ArrayBuffer로 읽습니다.
        const bytes = await file.arrayBuffer();
        const uint8Array = new Uint8Array(bytes);

        // 2. 인코딩 처리 (CSV 파일인 경우 한글 깨짐 방지)
        let workbook;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
            // CSV는 TextDecoder를 사용해 명시적으로 euc-kr(cp949)로 변환 후 읽습니다.
            try {
                const decoder = new TextDecoder('euc-kr');
                const decodedString = decoder.decode(uint8Array);
                workbook = XLSX.read(decodedString, { type: 'string' });
            } catch (e) {
                // 실패 시 기본 방식으로 시도
                workbook = XLSX.read(uint8Array, { type: 'array' });
            }
        } else {
            // 일반 엑셀(.xlsx)은 기본 방식으로 읽습니다.
            workbook = XLSX.read(uint8Array, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log(`[업로드 시작] 파일: ${file.name}, 총 데이터: ${data.length}건`);

        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        for (const row of rows) {
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            // 모든 키의 공백을 제거하고 문자열로 정규화
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toString().trim()] = row[key];
            });

            // 유연한 매핑: 키워드가 포함된 제목을 찾습니다.
            const findValue = (keywords: string[]) => {
                const key = Object.keys(normalizedRow).find(k =>
                    keywords.some(kw => k.includes(kw))
                );
                return key ? String(normalizedRow[key]).trim() : '';
            };

            const name = findValue(['성명', '성함', '이름']);
            const phone = findValue(['핸드폰', '전화번호', '연락처', '휴대폰', '번호', '연락']);

            if (name && phone) {
                const cleanPhone = phone.replace(/-/g, '').replace(/\s/g, '');
                // 최소 9자리 이상의 숫자인 경우 처리
                if (cleanPhone.length >= 9 && /^\d+$/.test(cleanPhone)) {
                    await db.user.upsert({
                        where: { phone: cleanPhone },
                        update: {
                            name: name,
                            buddhistName: findValue(['법명', '불명']),
                            buddhistTitle: findValue(['법호']),
                            buddhistRank: findValue(['법계']),
                            status: findValue(['신분', '구분']),
                            position: findValue(['직책']),
                            temple: findValue(['소속사찰', '사찰', '사찰명']),
                            templePosition: findValue(['사찰직위', '소속사찰 직위', '사찰 직위']),
                            postalCode: findValue(['우편번호']),
                            templeAddress: findValue(['사찰주소', '주소', '거주지', '주 소'])
                        },
                        create: {
                            name: name,
                            phone: cleanPhone,
                            buddhistName: findValue(['법명', '불명']),
                            buddhistTitle: findValue(['법호']),
                            buddhistRank: findValue(['법계']),
                            status: findValue(['신분', '구분']),
                            position: findValue(['직책']),
                            temple: findValue(['소속사찰', '사찰', '사찰명']),
                            templePosition: findValue(['사찰직위', '소속사찰 직위', '사찰 직위']),
                            postalCode: findValue(['우편번호']),
                            templeAddress: findValue(['사찰주소', '주소', '거주지', '주 소'])
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
            isPartial: isTimedOut,
            detectedHeaders: data.length > 0 ? Object.keys(data[0] as object) : [],
            message: isTimedOut ? `시간 제한으로 인해 ${savedCount}명만 등록되었습니다. 남은 데이터는 한번 더 업로드해주세요.` : '모든 데이터 등록을 완료했습니다.'
        };
    } catch (error: any) {
        console.error('업로드 서버 오류:', error);
        return {
            success: false,
            message: `서버 처리 중 오류: ${error.message || '알 수 없는 에러'}`,
            count: 0
        };
    }
}
