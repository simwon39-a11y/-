'use client';

import { useState, useEffect, useTransition, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getMessagesAction, sendMessageAction, getUserInfoAction, getChatListAction } from './actions';
import { searchMembersAction } from '@/app/search/actions';
import { markChatAsReadAction } from '@/app/api/unread/actions';
import { refreshAppBadge } from '@/lib/badgeClient';

// 직책/상태에 따른 호칭 포맷 헬퍼 함수
const formatUserTitle = (user: any) => {
    if (!user) return '사용자';
    const nameStr = user.buddhistName || user.name;
    return `${nameStr}님`;
};


function ChatContent() {
    const searchParams = useSearchParams();
    const toParam = searchParams.get('to');
    const otherId = toParam ? parseInt(toParam) : 0;

    const [messages, setMessages] = useState<any[]>([]);
    const [chatList, setChatList] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isPending, startTransition] = useTransition();
    const [user, setUser] = useState<any>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 새 메시지가 오거나 방이 바뀌면 하단으로 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, otherId]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const u = JSON.parse(userStr);
        setUser(u);

        if (otherId) {
            // [방 모드] 상대방 정보 가져오기
            getUserInfoAction(otherId).then(info => setOtherUser(info));

            // 메시지 불러오기 및 읽음 처리
            const loadAndMark = async () => {
                const data = await getMessagesAction(u.id, otherId);
                setMessages(data);
                await markChatAsReadAction(otherId);
                await refreshAppBadge();
            };

            loadAndMark();
            const interval = setInterval(loadAndMark, 3000);
            return () => clearInterval(interval);
        } else {
            // [목록 모드] 대화 목록 가져오기
            const loadList = async () => {
                const list = await getChatListAction(u.id);
                setChatList(list);
            };
            loadList();
            const interval = setInterval(loadList, 5000);
            return () => clearInterval(interval);
        }
    }, [otherId]);


    const handleSend = async () => {
        if (!inputText.trim() || !user || !otherId) return;

        const textToSend = inputText;
        setInputText('');

        startTransition(async () => {
            await sendMessageAction(user.id, otherId, textToSend);
        });
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchMembersAction(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // 대화 목록 화면
    if (!otherId) {
        const recentChats = chatList.slice(0, 3);

        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
                <header style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                    <h1 style={{ fontSize: '24px', color: 'var(--accent-primary)', margin: 0 }}>💬 대화 목록</h1>
                    <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>닫기</Link>
                </header>

                <div style={{ flex: 1, padding: '10px' }}>
                    <h2 style={{ fontSize: '16px', color: '#666', marginBottom: '10px', paddingLeft: '5px' }}>최근 대화 (최대 3개)</h2>
                    {recentChats.length > 0 ? recentChats.map((chat) => (
                        <Link key={chat.user.id} href={`/chat?to=${chat.user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card" style={{ marginBottom: '10px', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: chat.isRead ? '1px solid var(--border-color)' : '4px solid red' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatUserTitle(chat.user)}</span>
                                        <span style={{ fontSize: '12px', color: '#999' }}>{new Date(chat.lastTime).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '15px', color: chat.isRead ? '#666' : '#000', fontWeight: chat.isRead ? 'normal' : 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {chat.lastMessage}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '20px' }}>
                            <p style={{ color: '#888' }}>최근 대화 내용이 없습니다.</p>
                        </div>
                    )}

                    {/* 상대방 검색 영역 */}
                    <div style={{ marginTop: '30px', padding: '0 5px' }}>
                        <h2 style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>🔍 새로운 대화 상대 찾기</h2>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="성함, 법명, 사찰명 검색"
                                style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 15px' }} disabled={isSearching}>
                                {isSearching ? '...' : '검색'}
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {searchResults.length > 0 ? searchResults.map((result) => (
                                <Link key={result.id} href={`/chat?to=${result.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent-primary)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '25px' }}>{result.name} ({result.buddhistName || '법명없음'})</div>
                                            <div style={{ fontSize: '19px', color: '#666', marginTop: '5px' }}>{result.temple || '사찰 미지정'}</div>
                                        </div>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '21px' }}>대화하기 &gt;</span>
                                    </div>
                                </Link>
                            )) : searchQuery && !isSearching && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>검색 결과가 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // 채팅방 화면
    return (
        <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
            <header style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--accent-primary)', margin: 0 }}>
                    {otherUser ? formatUserTitle(otherUser) : '대화 중...'}
                </h1>
                <Link href="/chat" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
            </header>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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

export default function ChatRoom() {
    return (
        <Suspense fallback={<div>불러오는 중...</div>}>
            <ChatContent />
        </Suspense>
    );
}


