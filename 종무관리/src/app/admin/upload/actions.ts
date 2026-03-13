'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * 관리자가 업로드한 엑셀 파일을 읽어서 회원으로 등록하는 '서버 액션'입니다.
 * v6: 정밀 진단 데이터 반환 및 안전성 최강화 (종무관리 폴더 동기화)
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

            if (eucString.includes('성명') || eucString.includes('이름') || eucString.includes('전화')) {
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
            return { success: false, message: '서버가 파일을 읽었으나 내용이 비어있습니다.', count: 0 };
        }

        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        const sampleRows = rows.slice(0, 2).map(r => {
            const entry: any = {};
            Object.keys(r).forEach(k => entry[k.substring(0, 20)] = String(r[k]).substring(0, 20));
            return entry;
        });

        for (const row of rows) {
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toString().trim()] = String(row[key]).trim();
            });

            const findByKey = (keywords: string[]) => {
                const key = Object.keys(normalizedRow).find(k =>
                    keywords.some(kw => k.includes(kw))
                );
                return key ? normalizedRow[key] : null;
            };

            let name = findByKey(['성명', '성함', '이름', '성 명', '이 름']);
            let phone = findByKey(['핸드폰', '전화번호', '연락처', '휴대폰', '번호', '연락', '폰']);

            if (!phone || !name) {
                Object.keys(normalizedRow).forEach(key => {
                    const val = normalizedRow[key].replace(/-/g, '').replace(/\s/g, '');
                    if (!phone && val.startsWith('01') && val.length >= 9 && val.length <= 11 && /^\d+$/.test(val)) {
                        phone = normalizedRow[key];
                    }
                    if (!name && /^[가-힣]{2,5}$/.test(normalizedRow[key]) && !key.includes('법명') && !key.includes('사찰')) {
                        name = normalizedRow[key];
                    }
                });
            }

            if (name && phone) {
                const cleanPhone = phone.replace(/-/g, '').replace(/\s/g, '');
                if (cleanPhone.length >= 9) {
                    await db.user.upsert({
                        where: { phone: cleanPhone },
                        update: {
                            name: name,
                            buddhistName: findByKey(['법명', '불명', '법 명']) || '',
                            temple: findByKey(['소속사찰', '사찰', '사찰명']) || '',
                        },
                        create: {
                            name: name,
                            phone: cleanPhone,
                            buddhistName: findByKey(['법명', '불명', '법 명']) || '',
                            temple: findByKey(['소속사찰', '사찰', '사찰명']) || '',
                        },
                    });
                    savedCount++;
                }
            }
        }

        revalidatePath('/search');
        return {
            success: true,
            count: savedCount,
            isPartial: isTimedOut,
            debugInfo: sampleRows,
            message: savedCount === 0 ? '이름이나 전화번호 열을 찾지 못했습니다. 아래 진단 데이터를 확인해주세요.' : '등록 완료!'
        };
    } catch (error: any) {
        return { success: false, message: `서버 오류: ${error.message}`, count: 0 };
    }
}
