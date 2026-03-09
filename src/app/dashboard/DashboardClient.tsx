'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PushSubscriptionHandler from '@/components/PushSubscriptionHandler';
import InstallPWA from '@/components/InstallPWA';



interface DashboardClientProps {
    initialUser: any;
    initialNotices: any[];
    initialResources: any[];
    initialFrees: any[];
    initialUnreadDetails?: any;
}

export default function DashboardClient({
    initialUser,
    initialNotices,
    initialResources,
    initialFrees,
    initialUnreadDetails
}: DashboardClientProps) {
    const [user] = useState<any>(initialUser);
    const [unreadDetails, setUnreadDetails] = useState<any>(initialUnreadDetails);
    const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'loading'>('loading');
    const [isSubscribed, setIsSubscribed] = useState<boolean | 'loading'>('loading');
    const router = useRouter();

    // 읽지 않은 수 상세 정보 가져오기
    const fetchUnread = async () => {
        try {
            const res = await fetch('/api/unread');
            if (res.ok) {
                const data = await res.json();
                console.log('Unread check result:', data.details);
                setUnreadDetails(data.details);
                if (data.pushCount !== undefined) {
                    setIsSubscribed(data.pushCount > 0);
                }
            }
        } catch (err) {
            console.error('Fetch unread error:', err);
        }
    };

    useEffect(() => {
        if (initialUser) {
            localStorage.setItem('user', JSON.stringify(initialUser));
        }

        // 알림 권한 상태 확인
        if ('Notification' in window) {
            setPushStatus(Notification.permission);
        }

        // 컴포넌트 마운트 시 한 번 더 가져와서 최신화 (initial 데이터가 서버 시점일 수 있으므로)
        fetchUnread();

        const interval = setInterval(fetchUnread, 30000); // 30초마다 갱신

        // 윈도우 포커스(앱 다시 켬) 시 즉시 갱신
        window.addEventListener('focus', fetchUnread);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchUnread);
        };
    }, [initialUser]);



    const handleLogout = async () => {
        // 로그아웃 시 쿠키와 로컬스토리지 모두 제거
        localStorage.removeItem('user');

        // 서버 사이드 로그아웃을 위해 전용 API 또는 Action 호출 필요성 검토
        // 여기선 단순하게 쿠키 만료를 위해 login actions의 로그아웃 기능을 쓰거나 
        // 직접 document.cookie 수정을 시도할 수 있지만, 
        // 가장 확실한 건 로그아웃용 Server Action을 만드는 것입니다.

        // 임시로 그냥 홈으로 보냄 (로그아웃 액션이 필요함)
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/');
        router.refresh();
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <InstallPWA />
            {user && <PushSubscriptionHandler userId={user.id} />}



            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>회원 전용 화면</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.name} 법사님, 반갑습니다.</p>
                <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>
                    버전: 26.03.09.1630
                </div>
                <div style={{ fontSize: '12px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>
                        알림 권한: {pushStatus === 'granted' ? <span style={{ color: 'green' }}>✅ 허용됨</span> :
                            pushStatus === 'denied' ? <span style={{ color: 'red' }}>❌ 차단됨</span> :
                                <span style={{ color: 'orange' }}>⚠️ 확인 중</span>}
                        {` | `}
                        서버 등록: {isSubscribed === true ? <span style={{ color: 'green' }}>✅ 완료</span> :
                            isSubscribed === false ? <span style={{ color: 'red' }}>❌ 미등록</span> :
                                <span>...</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                            onClick={fetchUnread}
                            style={{ backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            🔄 숫자 새로고침
                        </button>
                        <button
                            onClick={() => window.location.href = `/dashboard?v=${Date.now()}`}
                            style={{ backgroundColor: '#fff', border: '1px solid #ff9800', color: '#ff9800', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            ⚡ 강제 업데이트
                        </button>
                    </div>
                </div>
            </header>


            {/* 1. 최신 공지사항 */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--accent-primary)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', color: 'var(--accent-primary)', margin: 0 }}>🔔 최근 공지사항</h2>
                        {unreadDetails?.notices > 0 && (
                            <span style={{ backgroundColor: 'red', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.notices}
                            </span>
                        )}
                    </div>
                    <Link href="/board" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                </div>

                {initialNotices.length > 0 ? (
                    <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{initialNotices[0].title}</h3>
                        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                            {initialNotices[0].content.length > 50 ? initialNotices[0].content.substring(0, 50) + '...' : initialNotices[0].content}
                        </p>
                        <Link href="/board" style={{ color: 'var(--accent-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                            상세 내용 보기 {'>'}
                        </Link>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>새로운 소식이 없습니다.</p>
                )}
            </section>

            {/* 2. 최근 불교 자료 */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '1px solid #4caf50', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '20px', color: '#4caf50', margin: 0 }}>📖 최근 불교 자료</h2>
                        {unreadDetails?.resources > 0 && (
                            <span style={{ backgroundColor: '#4caf50', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.resources}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/board/new?cat=RESOURCE" style={{ fontSize: '14px', color: '#4caf50', fontWeight: 'bold', textDecoration: 'none' }}>[글쓰기]</Link>
                        <Link href="/board" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                    </div>
                </div>

                {initialResources.length > 0 ? (
                    <div>
                        <Link href="/board" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{initialResources[0].title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {initialResources[0].author?.buddhistName ? `${initialResources[0].author.buddhistName} ` : ''}{initialResources[0].author?.name || '익명'} · {new Date(initialResources[0].createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>등록된 자료가 없습니다.</p>
                )}
            </section>

            {/* 3. 최근 자유게시판 */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '1px solid #2196f3', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '20px', color: '#2196f3', margin: 0 }}>💬 최근 자유 게시글</h2>
                        {unreadDetails?.frees > 0 && (
                            <span style={{ backgroundColor: '#2196f3', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.frees}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/board/new?cat=FREE" style={{ fontSize: '14px', color: '#2196f3', fontWeight: 'bold', textDecoration: 'none' }}>[글쓰기]</Link>
                        <Link href="/board" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                    </div>
                </div>

                {initialFrees.length > 0 ? (
                    <div>
                        <Link href="/board" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{initialFrees[0].title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {initialFrees[0].author?.buddhistName ? `${initialFrees[0].author.buddhistName} ` : ''}{initialFrees[0].author?.name || '익명'} · {new Date(initialFrees[0].createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>새로운 글이 없습니다.</p>
                )}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <Link href="/search" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '20px', fontSize: '20px' }}>
                    🔍 회원 및 사찰 검색
                </Link>

                <Link href="/chat" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '20px', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    💬 따뜻한 대화 (채팅)
                    {unreadDetails?.messages > 0 && (
                        <span style={{ backgroundColor: 'red', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                            {unreadDetails.messages}
                        </span>
                    )}
                </Link>


                <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '15px', fontSize: '16px', marginTop: '10px', backgroundColor: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>
                    로그아웃
                </button>
            </div>
        </main>
    );
}
