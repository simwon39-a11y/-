'use server';

import db from '@/lib/db';

import { sendPushNotification } from '@/lib/push';

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

    const message = await db.message.create({
        data: {
            senderId,
            receiverId,
            text
        },
        include: {
            sender: true
        }
    });

    // 상대방에게 푸시 알림을 보냅니다.
    try {
        await sendPushNotification(
            receiverId,
            `${message.sender.name} 법사님`,
            text,
            `/chat`
        );
    } catch (e) {
        console.error('Failed to send push notification:', e);
    }

    return message;
}
/**
 * 툭정 사용자의 기본 정보를 가져옵니다.
 */
export async function getUserInfoAction(userId: number) {
    return await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, buddhistName: true }
    });
}
