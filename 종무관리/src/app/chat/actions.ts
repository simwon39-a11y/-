'use server';

import db from '@/lib/db';

/**
 * 특정 상대방과의 채팅 메시지를 모두 가져옵니다.
 */
export async function getMessagesAction(myId: number, otherId: number) {
    return await db.message.findMany({
        where: {
            OR: [
                { senderId: myId, receiverId: otherId },
                { senderId: otherId, receiverId: myId }
            ]
        },
        orderBy: {
            createdAt: 'asc'
        }
    });
}

/**
 * 새 메시지를 보냅니다.
 */
export async function sendMessageAction(senderId: number, receiverId: number, text: string) {
    if (!text) return null;

    return await db.message.create({
        data: {
            senderId,
            receiverId,
            text
        }
    });
}
