import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { getUnreadCounts } from '@/lib/unread';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const counts = await getUnreadCounts(user.id);

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Unread count error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
