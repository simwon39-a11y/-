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
        const sender = message.sender;
        const nameStr = sender.buddhistName || sender.name;
        const senderTitle = `${nameStr}님`;

        await sendPushNotification(
            receiverId,
            senderTitle,
            text,
            `/chat?to=${senderId}`
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
        select: { id: true, name: true, buddhistName: true, status: true }
    });
}

/**
 * 내가 대화한 사람들의 목록을 가져옵니다. (최근 메시지 순)
 */
export async function getChatListAction(myId: number) {
    // 1. 내가 관여된 모든 메시지 가져오기
    const messages = await db.message.findMany({
        where: {
            OR: [
                { senderId: myId },
                { receiverId: myId }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            sender: { select: { id: true, name: true, buddhistName: true, status: true } },
            receiver: { select: { id: true, name: true, buddhistName: true, status: true } }
        }
    });

    // 2. 상대방 아이디별로 가장 최근 메시지만 남기기
    const partners: any[] = [];
    const seenIds = new Set<number>();

    for (const msg of messages) {
        const other = msg.senderId === myId ? msg.receiver : msg.sender;
        if (!seenIds.has(other.id)) {
            seenIds.add(other.id);
            partners.push({
                user: other,
                lastMessage: msg.text,
                lastTime: msg.createdAt,
                isRead: msg.senderId === myId ? true : msg.isRead
            });
        }
    }

    return partners;
}
