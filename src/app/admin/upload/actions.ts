'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 * v5: 지능형 헤더 매핑 및 인코딩 자동 복구 강화
 */
export async function uploadExcelAction(formData: FormData) {
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8500; // 8.5초 안전선

    try {
        const file = formData.get('excel-file') as File;
        if (!file) {
            return { success: false, message: '파일이 선택되지 않았습니다.', count: 0 };
        }

        const bytes = await file.arrayBuffer();
        const uint8Array = new Uint8Array(bytes);
        const fileName = file.name.toLowerCase();

        let workbook;
        if (fileName.endsWith('.csv')) {
            // 다양한 인코딩 시도
            try {
                // 1. EUC-KR 시도
                const decoder = new TextDecoder('euc-kr');
                const decodedString = decoder.decode(uint8Array);
                workbook = XLSX.read(decodedString, { type: 'string' });

                // 만약 첫 시트의 첫 줄에 한글 깨짐이 심하면 UTF-8로 재시도 (간단한 체크)
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const firstRow = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[];
                const firstCell = String(firstRow?.[0] || '');
                if (firstCell.includes('À') || firstCell.includes('¶')) {
                    throw new Error('Encoding might be UTF-8');
                }
            } catch (e) {
                // 2. UTF-8 시도
                const decoder = new TextDecoder('utf-8');
                const decodedString = decoder.decode(uint8Array);
                workbook = XLSX.read(decodedString, { type: 'string' });
            }
        } else {
            workbook = XLSX.read(uint8Array, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (data.length === 0) {
            return { success: false, message: '엑셀 파일에 데이터가 없습니다.', count: 0 };
        }

        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        // 헤더 목록 추출
        const originalHeaders = Object.keys(rows[0]);

        for (const row of rows) {
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            // 모든 키/값을 문자열로 정규화
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toString().trim()] = String(row[key]).trim();
            });

            // [지능형 매핑] 
            // 1. 단어 포함 여부로 매핑 시도
            const findByKey = (keywords: string[]) => {
                const key = Object.keys(normalizedRow).find(k =>
                    keywords.some(kw => k.includes(kw))
                );
                return key ? normalizedRow[key] : null;
            };

            let name = findByKey(['성명', '성함', '이름', '성 명', '이 름']);
            let phone = findByKey(['핸드폰', '전화번호', '연락처', '휴대폰', '번호', '연락', '폰']);

            // 2. 헤더가 깨졌을 경우를 대비한 '내용 기반' 자동 감지
            if (!phone || !name) {
                Object.keys(normalizedRow).forEach(key => {
                    const val = normalizedRow[key].replace(/-/g, '').replace(/\s/g, '');
                    // 01로 시작하고 9~11자리 숫자인 경우를 핸드폰으로 간주
                    if (!phone && val.startsWith('01') && val.length >= 9 && val.length <= 11 && /^\d+$/.test(val)) {
                        phone = normalizedRow[key];
                    }
                    // 한글이 2~5자이고 다른 헤더가 아닐 경우 이름으로 후보 선정 (처음 발견된 것)
                    if (!name && /^[가-힣]{2,5}$/.test(normalizedRow[key]) && !key.includes('법명') && !key.includes('사찰')) {
                        name = normalizedRow[key];
                    }
                });
            }

            if (name && phone) {
                const cleanPhone = phone.replace(/-/g, '').replace(/\s/g, '');
                if (cleanPhone.length >= 9 && /^\d+$/.test(cleanPhone)) {
                    await db.user.upsert({
                        where: { phone: cleanPhone },
                        update: {
                            name: name,
                            buddhistName: findByKey(['법명', '불명']) || '',
                            buddhistTitle: findByKey(['법호']) || '',
                            buddhistRank: findByKey(['법계']) || '',
                            status: findByKey(['신분', '구분']) || '',
                            position: findByKey(['직책']) || '',
                            temple: findByKey(['소속사찰', '사찰', '사찰명']) || '',
                            templePosition: findByKey(['사찰직위', '직위']) || '',
                            postalCode: findByKey(['우편번호']) || '',
                            templeAddress: findByKey(['사찰주소', '주소', '거주지']) || ''
                        },
                        create: {
                            name: name,
                            phone: cleanPhone,
                            buddhistName: findByKey(['법명', '불명']) || '',
                            buddhistTitle: findByKey(['법호']) || '',
                            buddhistRank: findByKey(['법계']) || '',
                            status: findByKey(['신분', '구분']) || '',
                            position: findByKey(['직책']) || '',
                            temple: findByKey(['소속사찰', '사찰', '사찰명']) || '',
                            templePosition: findByKey(['사찰직위', '직위']) || '',
                            postalCode: findByKey(['우편번호']) || '',
                            templeAddress: findByKey(['사찰주소', '주소', '거주지']) || ''
                        },
                    });
                    savedCount++;
                }
            }
        }

        revalidatePath('/search');
        revalidatePath('/dashboard');

        return {
            success: true,
            count: savedCount,
            isPartial: isTimedOut,
            detectedHeaders: originalHeaders,
            message: isTimedOut ? `안전을 위해 ${savedCount}명만 등록했습니다. 나머지는 다시 업로드해주세요.` : '모든 등록이 완료되었습니다.'
        };
    } catch (error: any) {
        console.error('업로드 서버 오류:', error);
        return {
            success: false,
            message: `서버 처리 오류: ${error.message}`,
            count: 0
        };
    }
}
