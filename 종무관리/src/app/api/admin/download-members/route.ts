import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    try {
        const users = await db.user.findMany({
            orderBy: { name: 'asc' },
        });

        // 엑셀 포맷으로 변환 (한글 헤더)
        const excelData = users.map(u => ({
            '이름': u.name || '',
            '전화번호': u.phone || '',
            '법명': u.buddhistName || '',
            '법호': u.buddhistTitle || '',
            '법계': u.buddhistRank || '',
            '신분': u.status || '',
            '직책': u.position || '',
            '소속사찰': u.temple || '',
            '소속분회': u.templePosition || '',
            '우편번호': u.postalCode || '',
            '사찰주소': u.templeAddress || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '회원명단');

        // 버퍼로 변환
        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="buddhist_members_${new Date().toISOString().slice(0, 10)}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });
    } catch (e: any) {
        return new NextResponse(`Error: ${e.message}`, { status: 500 });
    }
}
