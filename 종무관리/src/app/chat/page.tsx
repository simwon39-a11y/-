'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { getMessagesAction, sendMessageAction } from './actions';

export default function ChatRoom() {
    // 실제 서비스에서는 로그인한 사용자 ID를 세션에서 가져와야 하지만, 
    // 지금은 테스트를 위해 임시로 1번(나), 2번(상대방)으로 설정합니다.
    const myId = 1;
    const otherId = 2;

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isPending, startTransition] = useTransition();

    // 메시지 불러오기 함수
    const loadMessages = async () => {
        const data = await getMessagesAction(myId, otherId);
        setMessages(data);
    };

    // 처음에 불러오고, 3초마다 자동으로 새 메시지가 있는지 확인합니다 (폴링)
    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText(''); // 입력창 미리 비우기 (부드러운 경험)

        startTransition(async () => {
            await sendMessageAction(myId, otherId, textToSend);
            loadMessages(); // 보낸 후 즉시 다시 불러오기
        });
    };

    return (
        <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
            <header style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--accent-primary)' }}>김철수 법사님과의 대화</h1>
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>닫기</Link>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.length > 0 ? messages.map((msg) => {
                    const isMe = msg.senderId === myId;
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
