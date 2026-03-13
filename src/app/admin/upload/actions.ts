'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * v8: 초정밀 제목 매핑 및 인코딩 완전 정복
 */
export async function uploadExcelAction(formData: FormData) {
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8500;

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
            const eucDecoder = new TextDecoder('euc-kr');
            const eucString = eucDecoder.decode(uint8Array);

            // 한글 포함 여부를 좀 더 넓게 체크
            if (eucString.includes('성명') || eucString.includes('이름') || eucString.includes('전화') || eucString.includes('핸드폰')) {
                workbook = XLSX.read(eucString, { type: 'string' });
            } else {
                const utfDecoder = new TextDecoder('utf-8');
                const utfString = utfDecoder.decode(uint8Array);
                workbook = XLSX.read(utfString, { type: 'string' });
            }
        } else {
            workbook = XLSX.read(uint8Array, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!data || data.length === 0) {
            return { success: false, message: '파일의 내용을 읽어낼 수 없습니다. (빈 파일이거나 형식이 잘못됨)', count: 0 };
        }

        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        // 진단용 데이터 (원본 키를 보존하여 반환)
        const sampleRows = rows.slice(0, 3).map(r => {
            const entry: any = {};
            Object.keys(r).forEach(k => {
                const cleanKey = k.toString().trim().substring(0, 20);
                entry[cleanKey] = String(r[k]).substring(0, 30);
            });
            return entry;
        });

        for (const row of rows) {
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            // 행 데이터 정규화 (키와 값 모두 트림)
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.toString().replace(/\s/g, '').trim();
                normalizedRow[cleanKey] = String(row[key]).trim();
            });

            const findValue = (keywords: string[]) => {
                const foundKey = Object.keys(normalizedRow).find(k =>
                    keywords.some(kw => k.includes(kw) || kw.includes(k)) // 상호 포함 체크
                );
                return foundKey ? normalizedRow[foundKey] : null;
            };

            let name = findValue(['성명', '성함', '이름', '이 름', '성 명', '고객명', '회원명']);
            let phone = findValue(['핸드폰', '전화번호', '연락처', '휴대폰', '번호', '연락', '폰', '전화', 'H.P', 'HP']);

            // 데이터 기반 강제 추적 (제목이 깨졌을 경우 대비)
            if (!name || !phone) {
                for (const k of Object.keys(normalizedRow)) {
                    const val = normalizedRow[k];
                    const cleanVal = val.replace(/-/g, '').replace(/\s/g, '');

                    // 전화번호 패턴 감지 (01로 시작하는 9~11자리 숫자)
                    if (!phone && cleanVal.startsWith('01') && cleanVal.length >= 9 && cleanVal.length <= 11 && /^\d+$/.test(cleanVal)) {
                        phone = val;
                    }
                    // 이름 패턴 감지 (가장 유력한 칸을 이름으로 지정)
                    if (!name && /^[가-힣]{2,4}$/.test(val)) {
                        // 법명, 사찰, 직책 등이 아닌 경우만 이름으로 취급
                        if (!k.includes('법명') && !k.includes('사찰') && !k.includes('직책') && !k.includes('신분') && !k.includes('법호')) {
                            name = val;
                        }
                    }
                }
            }

            if (name && phone) {
                const cleanPhone = phone.replace(/-/g, '').replace(/\s/g, '');
                if (cleanPhone.length >= 9) {
                    try {
                        await db.user.upsert({
                            where: { phone: cleanPhone },
                            update: {
                                name: name,
                                buddhistName: findValue(['법명', '불명']) || '',
                                temple: findValue(['소속사찰', '사찰', '사찰명']) || '',
                            },
                            create: {
                                name: name,
                                phone: cleanPhone,
                                buddhistName: findValue(['법명', '불명']) || '',
                                temple: findValue(['소속사찰', '사찰', '사찰명']) || '',
                            },
                        });
                        savedCount++;
                    } catch (e) {
                        console.error('Upsert Error:', e);
                    }
                }
            }
        }

        revalidatePath('/search');
        return {
            success: true,
            count: savedCount,
            isPartial: isTimedOut,
            debugInfo: sampleRows,
            message: savedCount === 0 ? '이름이나 전화번호 열을 찾지 못했습니다. 파일의 열 제목을 확인해 주세요.' : `${savedCount}명의 정보를 성공적으로 등록/업데이트했습니다.`
        };
    } catch (error: any) {
        return { success: false, message: `서버 오류 발생: ${error.message}`, count: 0 };
    }
}
