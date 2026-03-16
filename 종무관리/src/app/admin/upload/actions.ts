'use server';

import * as XLSX from 'xlsx';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * v10: 모든 필드 동기화 엔진 (종무관리 폴더)
 */
export async function uploadExcelAction(formData: FormData) {
    const startTime = Date.now();
    const TIMEOUT_LIMIT = 13500; // 8.5초 -> 13.5초 연장

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
            return { success: false, message: '파일의 내용을 읽어낼 수 없습니다.', count: 0 };
        }

        const rows = data as any[];
        let savedCount = 0;
        let isTimedOut = false;

        const sampleRows = rows.slice(0, 3).map(r => {
            const entry: any = {};
            Object.keys(r).forEach(k => {
                const cleanKey = k.toString().trim().substring(0, 20);
                entry[cleanKey] = String(r[k]).substring(0, 30);
            });
            return entry;
        });

        // v15.4: 중복된 전화번호가 있을 경우, 더 정보량이 많은(긴) 데이터를 우선순위로 병합하는 스마트 엔진 도입 (종무관리)
        const memberMap = new Map<string, any>();

        for (const row of rows) {
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.toString().replace(/\s/g, '').trim();
                normalizedRow[cleanKey] = String(row[key]).trim();
            });

            const findValue = (rowObj: any, keywords: string[]) => {
                // 1. 완전 일치(Exact Match) 우선
                let foundKey = Object.keys(rowObj).find(k => keywords.includes(k));
                if (foundKey) return rowObj[foundKey];

                // 2. 부분 일치(Fallback)
                foundKey = Object.keys(rowObj).find(k =>
                    keywords.some(kw => k.includes(kw))
                );
                return foundKey ? rowObj[foundKey] : null;
            };

            let name = findValue(normalizedRow, ['성명', '성함', '이름', '고객명', '회원명']);
            let phone = findValue(normalizedRow, ['핸드폰', '전화번호', '연락처', '휴대폰', '번호', 'H.P', 'HP']);

            if (!phone) {
                for (const k of Object.keys(normalizedRow)) {
                    const val = normalizedRow[k];
                    const cleanVal = val.replace(/-/g, '').replace(/\s/g, '');
                    if (cleanVal.startsWith('01') && cleanVal.length >= 9 && cleanVal.length <= 11 && /^\d+$/.test(cleanVal)) {
                        phone = val;
                        break;
                    }
                }
            }

            if (phone) {
                const cleanPhone = phone.replace(/-/g, '').replace(/\s/g, '');
                if (cleanPhone.length >= 9) {
                    const existing = memberMap.get(cleanPhone);
                    const currentData = {
                        name: name,
                        buddhistName: findValue(normalizedRow, ['법명']),
                        buddhistTitle: findValue(normalizedRow, ['법호']),
                        buddhistRank: findValue(normalizedRow, ['법계']),
                        status: findValue(normalizedRow, ['신분']),
                        position: findValue(normalizedRow, ['직책']),
                        memberGrade: findValue(normalizedRow, ['회원등급']), // Additional field if any
                        // 정확한 매칭을 위해 우선 순위를 분리합니다.
                        // '소속사찰'이 '소속사찰직위'를 잘못 잡아먹지 않도록, 긴 단어를 먼저 찾습니다.
                        templePosition: findValue(normalizedRow, ['소속사찰직위', '소속분회', '분회']),
                        temple: findValue(normalizedRow, ['소속사찰', '사찰명', '사찰']),
                        division: findValue(normalizedRow, ['분회']),
                        templeAddress: findValue(normalizedRow, ['사찰주소', '주소']),
                    };

                    if (!existing) {
                        memberMap.set(cleanPhone, currentData);
                    } else {
                        // 스마트 병합
                        const merged = { ...existing };
                        (Object.keys(currentData) as Array<keyof typeof currentData>).forEach(key => {
                            const oldVal = String(existing[key] || '');
                            const newVal = String(currentData[key] || '');

                            // 새 데이터가 비어있지 않다면 무조건 덮어씌움 (글자 수정 등 온전한 반영)
                            if (newVal && newVal.trim() !== '') {
                                merged[key] = newVal.trim();
                            }
                        });
                        memberMap.set(cleanPhone, merged);
                    }
                }
            }
        }

        // 병합된 최종 데이터를 DB에 저장 (초고속 병렬 처리 모드)
        const memberEntries = Array.from(memberMap.entries());
        const CHUNK_SIZE = 15; // 한 번에 15명씩 묶어서 처리

        for (let i = 0; i < memberEntries.length; i += CHUNK_SIZE) {
            if (Date.now() - startTime > TIMEOUT_LIMIT) {
                isTimedOut = true;
                break;
            }

            const chunk = memberEntries.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(async ([cleanPhone, m]) => {
                try {
                    await db.user.upsert({
                        where: { phone: cleanPhone },
                        update: {
                            name: m.name || undefined,
                            buddhistName: m.buddhistName || null,
                            buddhistTitle: m.buddhistTitle || null,
                            buddhistRank: m.buddhistRank || null,
                            status: m.status || null,
                            position: m.position || null,
                            temple: m.temple || null,
                            templePosition: m.templePosition || null,
                            division: m.division || null,
                            templeAddress: m.templeAddress || null,
                        },
                        create: {
                            name: m.name || '이름없음',
                            phone: cleanPhone,
                            buddhistName: m.buddhistName || null,
                            buddhistTitle: m.buddhistTitle || null,
                            buddhistRank: m.buddhistRank || null,
                            status: m.status || null,
                            position: m.position || null,
                            temple: m.temple || null,
                            templePosition: m.templePosition || null,
                            division: m.division || null,
                            templeAddress: m.templeAddress || null,
                        },
                    });
                    return true;
                } catch (e) {
                    console.error('Upsert Error on phone ' + cleanPhone + ':', e);
                    return false;
                }
            });

            // 15명의 데이터를 동시에 저장하고 끝날 때까지 대기
            const results = await Promise.all(promises);
            savedCount += results.filter(success => success).length;
        }

        // v17: 엑셀 파일에 없는 기존 회원 일괄 삭제 (Full Sync)
        const uploadedPhoneNumbers = Array.from(memberMap.keys());

        // 하이픈이 있는 형식(010-XXXX-YYYY)의 변형도 보호 배열에 추가
        const protectedNumbers = [...uploadedPhoneNumbers];
        uploadedPhoneNumbers.forEach(phone => {
            if (phone.length === 11) {
                protectedNumbers.push(`${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7, 11)}`);
            } else if (phone.length === 10) {
                protectedNumbers.push(`${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`);
            }
        });

        let deletedCount = 0;
        try {
            const deleteResult = await db.user.deleteMany({
                where: {
                    phone: {
                        notIn: protectedNumbers
                    }
                }
            });
            deletedCount = deleteResult.count;
        } catch (delError) {

            console.error('Delete Missing Users Error:', delError);
        }

        revalidatePath('/search');
        return {
            success: true,
            count: savedCount,
            isPartial: isTimedOut,
            debugInfo: sampleRows,
            message: `${savedCount}명의 정보를 등록/업데이트했습니다. (엑셀에 없는 ${deletedCount}명은 시스템에서 삭제되었습니다.)`
        };
    } catch (error: any) {
        return { success: false, message: `서버 오류 발생: ${error.message}`, count: 0 };
    }
}
