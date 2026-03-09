import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, subscription } = body;

        if (!userId || !subscription) {
            return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 });
        }

        // 기존 구독 정보 업데이트 또는 생성
        await (db as any).pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
