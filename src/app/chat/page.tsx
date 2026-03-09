'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { getMessagesAction, sendMessageAction } from './actions';
import { markChatAsReadAction } from '@/app/api/unread/actions';

export default function ChatRoom() {
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isPending, startTransition] = useTransition();
    const [user, setUser] = useState<any>(null);

    // 실제 서비스에서는 다른 사람의 ID를 파라미터로 받아야 하지만 
    // 현재 구현에 맞춰 임시로 2번으로 설정
    const otherId = 2;

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);

            // 메시지 불러오기 및 읽음 처리
            const loadAndMark = async () => {
                const data = await getMessagesAction(u.id, otherId);
                setMessages(data);
                await markChatAsReadAction(otherId);
            };
            loadAndMark();

            const interval = setInterval(loadAndMark, 3000);
            return () => clearInterval(interval);
        }
    }, []);


    const handleSend = async () => {
        if (!inputText.trim() || !user) return;

        const textToSend = inputText;
        setInputText('');

        startTransition(async () => {
            await sendMessageAction(user.id, otherId, textToSend);
            // 다음 인클로저(setInterval)에서 자연스럽게 갱신되므로 
            // 여기선 따로 호출하지 않아도 됨
        });
    };

    return (
        <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
            <header style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>김철수 법사님과의 대화</h1>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>닫기</Link>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length > 0 ? messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <div style={{
                                backgroundColor: isMe ? 'var(--accent-primary)' : 'white',
                                color: isMe ? 'white' : 'var(--text-primary)',
                                padding: '12px 16px',
                                borderRadius: '15px',
                                border: isMe ? 'none' : '1px solid var(--border-color)',
                                fontSize: '20px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                }) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>따뜻한 대화를 시작해 보세요.</p>
                )}
            </div>

            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'white', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="메시지를 입력하세요"
                    style={{ flex: 1, padding: '15px', fontSize: '18px', borderRadius: '25px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
                <button className="btn btn-primary" onClick={handleSend} style={{ width: '80px', borderRadius: '25px' }}>
                    전송
                </button>
            </div>
        </main>
    );
}
