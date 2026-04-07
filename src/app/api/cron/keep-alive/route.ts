import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
    try {
        // 데이터베이스가 일시 정지(Pause)되는 것을 방지하기 위해 가벼운 쿼리 실행
        await db.user.findFirst({
            select: { id: true }
        });
        
        console.log('[Cron] Keep-alive ping executed successfully.');
        
        // 캐시 무효화 (선택적)
        revalidatePath('/');

        return NextResponse.json({ 
            status: 'ok', 
            message: 'Database connection successful. Keep-alive ping sent.',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron] Keep-alive error:', error);
        return NextResponse.json({ 
            status: 'error', 
            message: error.message || 'Unknown execution error' 
        }, { status: 500 });
    }
}
