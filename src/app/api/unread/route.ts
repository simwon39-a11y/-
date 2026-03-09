import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // 1. 읽지 않은 메시지 수
        const unreadMessages = await (db as any).message.count({
            where: {
                receiverId: userId,
                isRead: false
            }
        });

        // 2. 사용자의 마지막 확인 시간 가져오기
        const userData = await (db as any).user.findUnique({
            where: { id: userId },
            select: {
                lastNoticeViewAt: true,
                lastResourceViewAt: true,
                lastFreeViewAt: true
            }
        });

        if (!userData) {
            return NextResponse.json({ totalUnread: unreadMessages });
        }

        // 3. 각 카테고리별 읽지 않은 게시글 수
        const [unreadNotices, unreadResources, unreadFrees] = await Promise.all([
            (db as any).post.count({
                where: {
                    category: 'NOTICE',
                    createdAt: { gt: (userData as any).lastNoticeViewAt }
                }
            }),
            (db as any).post.count({
                where: {
                    category: 'RESOURCE',
                    createdAt: { gt: (userData as any).lastResourceViewAt }
                }
            }),
            (db as any).post.count({
                where: {
                    category: 'FREE',
                    createdAt: { gt: (userData as any).lastFreeViewAt }
                }
            })
        ]);


        const totalUnread = unreadMessages + unreadNotices + unreadResources + unreadFrees;

        return NextResponse.json({
            totalUnread,
            details: {
                messages: unreadMessages,
                notices: unreadNotices,
                resources: unreadResources,
                frees: unreadFrees
            }
        });
    } catch (error) {
        console.error('Unread count error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
