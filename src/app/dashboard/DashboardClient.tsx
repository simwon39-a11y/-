'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PushSubscriptionHandler from '@/components/PushSubscriptionHandler';
import InstallPWA from '@/components/InstallPWA';
import { refreshAppBadge } from '@/lib/badgeClient';
import { getPostsByCategoryAction } from '@/app/board/actions';

interface DashboardClientProps {
    initialUser: any;
    initialNotices?: any[];
    initialResources?: any[];
    initialFrees?: any[];
    initialUnreadDetails?: any;
    initialPushStatus?: boolean;
    vapidPublicKey: string;
}

export default function DashboardClient({
    initialUser,
    initialNotices,
    initialResources,
    initialFrees,
    initialUnreadDetails,
    initialPushStatus,
    vapidPublicKey
}: DashboardClientProps) {

    const [user] = useState<any>(initialUser);
    const [unreadDetails, setUnreadDetails] = useState<any>(initialUnreadDetails || undefined);
    const [notices, setNotices] = useState<any[] | null>(initialNotices || null);
    const [resources, setResources] = useState<any[] | null>(initialResources || null);
    const [frees, setFrees] = useState<any[] | null>(initialFrees || null);
    const [isSubscribed, setIsSubscribed] = useState<boolean | 'loading'>(
        initialPushStatus !== undefined ? initialPushStatus : 'loading'
    );
    const router = useRouter();

    const fetchUnread = async () => {
        try {
            const res = await fetch('/api/unread');
            if (res.ok) {
                const data = await res.json();
                setUnreadDetails(data.details);
                if (data.pushCount !== undefined) {
                    setIsSubscribed(data.pushCount > 0);
                }
                await refreshAppBadge();
            }
        } catch (err) {
            console.error('Fetch unread error:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const [n, r, f] = await Promise.all([
                getPostsByCategoryAction('NOTICE', 1),
                getPostsByCategoryAction('RESOURCE', 1),
                getPostsByCategoryAction('FREE', 1)
            ]);
            setNotices(n);
            setResources(r);
            setFrees(f);
        } catch (err) {
            console.error('Fetch posts error:', err);
        }
    };

    useEffect(() => {
        if (initialUser) {
            localStorage.setItem('user', JSON.stringify(initialUser));
        }

        // 서버에서 초기 데이터를 가져왔으므로 초기 fetchUnread, fetchPosts는 호출하지 않음

        const interval = setInterval(() => {
            fetchUnread();
            fetchPosts();
        }, 30000);
        window.addEventListener('focus', fetchUnread);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', fetchUnread);
        };
    }, [initialUser]);

    const handleLogout = async () => {
        localStorage.removeItem('user');
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/');
        router.refresh();
    };

    const registerPush = async () => {
        if (!user) return;
        try {
            if (!('serviceWorker' in navigator)) {
                alert('이 브라우저는 서비스 워커를 지원하지 않습니다.');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                alert('알림 권한이 거부되었습니다. 핸드폰 설정에서 알림을 허용해 주세요.');
                return;
            }

            if (!vapidPublicKey) {
                alert('VAPID 키가 설정되지 않았습니다. 관리자에게 문의하세요.');
                return;
            }

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
                const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: outputArray
                });
            }

            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    subscription: JSON.parse(JSON.stringify(subscription))
                })
            });

            if (res.ok) {
                alert('서버 등록이 완료되었습니다! 이제 숫자가 정상적으로 표시됩니다.');
                fetchUnread();
            } else {
                alert('서버 등록에 실패했습니다. 다시 시도해 주세요.');
            }
        } catch (error) {
            console.error('Manual registration error:', error);
            alert('등록 중 오류 발생: ' + error);
        }
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', width: '100%', margin: '0' }}>
            <InstallPWA />
            {user && <PushSubscriptionHandler userId={user.id} />}

            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>회원 전용 화면</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.name} 법사님, 반갑습니다.</p>
                <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>
                    버전: 26.03.11.1745 (최신)
                </div>

                {isSubscribed === false && (
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff9c4', borderRadius: '12px', border: '1px solid #fbc02d', textAlign: 'left' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f57f17', fontWeight: 'bold' }}>
                            🔔 알림 및 아이콘 숫자 설정이 필요합니다
                        </p>
                        <button
                            onClick={registerPush}
                            style={{ width: '100%', padding: '12px', backgroundColor: '#fbc02d', color: '#5f4b00', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                        >
                            지금 앱 알림 등록하기
                        </button>
                    </div>
                )}
            </header>

            {/* 1. 최신 공지사항 */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--accent-primary)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '22px', color: 'var(--accent-primary)', margin: 0 }}>🔔 최근 공지사항</h2>
                        {unreadDetails && unreadDetails.notices > 0 && (
                            <span style={{ backgroundColor: 'red', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.notices}
                            </span>
                        )}
                    </div>
                    <Link href="/board?cat=NOTICE" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                </div>

                {notices === null ? (
                    <div style={{ animation: 'pulse 1.5s infinite' }}>
                        <div style={{ height: '24px', background: '#f0f0f0', borderRadius: '4px', width: '80%', marginBottom: '10px' }}></div>
                        <div style={{ height: '18px', background: '#f5f5f5', borderRadius: '4px', width: '100%', marginBottom: '5px' }}></div>
                        <div style={{ height: '18px', background: '#f5f5f5', borderRadius: '4px', width: '60%' }}></div>
                    </div>
                ) : notices.length > 0 ? (
                    <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{notices[0].title}</h3>
                        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                            {notices[0].content && notices[0].content.length > 50
                                ? notices[0].content.substring(0, 50) + '...'
                                : (notices[0].content || '내용을 확인하려면 클릭하세요.')}
                        </p>
                        <Link href="/board?cat=NOTICE" style={{ color: 'var(--accent-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
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
                        {unreadDetails && unreadDetails.resources > 0 && (
                            <span style={{ backgroundColor: '#4caf50', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.resources}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/board/new?cat=RESOURCE" style={{ fontSize: '14px', color: '#4caf50', fontWeight: 'bold', textDecoration: 'none' }}>[글쓰기]</Link>
                        <Link href="/board?cat=RESOURCE" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                    </div>
                </div>

                {resources === null ? (
                    <div style={{ animation: 'pulse 1.5s infinite' }}>
                        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '70%', marginBottom: '8px' }}></div>
                        <div style={{ height: '14px', background: '#f5f5f5', borderRadius: '4px', width: '40%' }}></div>
                    </div>
                ) : resources.length > 0 ? (
                    <div>
                        <Link href="/board?cat=RESOURCE" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{resources[0].title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {resources[0].author?.buddhistName ? `${resources[0].author.buddhistName} ` : ''}{resources[0].author?.name || '익명'} · {new Date(resources[0].createdAt).toLocaleDateString()}
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
                        {unreadDetails && unreadDetails.frees > 0 && (
                            <span style={{ backgroundColor: '#2196f3', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                                {unreadDetails.frees}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link href="/board/new?cat=FREE" style={{ fontSize: '14px', color: '#2196f3', fontWeight: 'bold', textDecoration: 'none' }}>[글쓰기]</Link>
                        <Link href="/board?cat=FREE" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                    </div>
                </div>

                {frees === null ? (
                    <div style={{ animation: 'pulse 1.5s infinite' }}>
                        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '70%', marginBottom: '8px' }}></div>
                        <div style={{ height: '14px', background: '#f5f5f5', borderRadius: '4px', width: '40%' }}></div>
                    </div>
                ) : frees.length > 0 ? (
                    <div>
                        <Link href="/board?cat=FREE" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{frees[0].title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {frees[0].author?.buddhistName ? `${frees[0].author.buddhistName} ` : ''}{frees[0].author?.name || '익명'} · {new Date(frees[0].createdAt).toLocaleDateString()}
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
                    {unreadDetails && unreadDetails.messages > 0 && (
                        <span style={{ backgroundColor: 'red', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: '14px', fontWeight: 'bold' }}>
                            {unreadDetails.messages}
                        </span>
                    )}
                </Link>

                <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '15px', fontSize: '16px', marginTop: '10px', backgroundColor: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>
                    로그아웃
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}} />
        </main>
    );
}
