'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PushSubscriptionHandler from '@/components/PushSubscriptionHandler';
import InstallPWA from '@/components/InstallPWA';
import { sendTestPushAction } from './actions';




interface DashboardClientProps {
    initialUser: any;
    initialNotices: any[];
    initialResources: any[];
    initialFrees: any[];
    initialUnreadDetails?: any;
    vapidPublicKey: string;
}


export default function DashboardClient({
    initialUser,
    initialNotices,
    initialResources,
    initialFrees,
    initialUnreadDetails,
    vapidPublicKey
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
        localStorage.removeItem('user');
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/');
        router.refresh();
    };

    const testBadge = async (count: number) => {
        if ('setAppBadge' in navigator) {
            try {
                await (navigator as any).setAppBadge(count);
                alert(`배지 ${count}개 설정 시도 완료! 바탕화면 아이콘에 숫자가 생겼는지 확인해 보세요.`);
            } catch (err) {
                alert('배지 설정 오류: ' + err);
            }
        } else {
            alert('이 기기의 브라우저는 앱 배지(숫자 표시) 기능을 지원하지 않습니다.');
        }
    };

    const clearBadge = async () => {
        if ('clearAppBadge' in navigator) {
            try {
                await (navigator as any).clearAppBadge();
                alert('배지 지우기 시도 완료!');
            } catch (err) {
                alert('배지 지우기 오류: ' + err);
            }
        }
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
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
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
                fetchUnread(); // 상태 즉시 갱신
            } else {
                alert('서버 등록에 실패했습니다. 다시 시도해 주세요.');
            }
        } catch (error) {
            console.error('Manual registration error:', error);
            alert('등록 중 오류 발생: ' + error);
        }
    };

    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }



    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <InstallPWA />
            {user && <PushSubscriptionHandler userId={user.id} />}



            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>회원 전용 화면</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{user?.name} 법사님, 반갑습니다.</p>
                <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>
                    버전: 26.03.09.2240
                </div>


                {typeof window !== 'undefined' && !window.matchMedia('(display-mode: standalone)').matches && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', padding: '10px', backgroundColor: '#fff9c4', borderRadius: '8px' }}>
                        💡 아이콘에 숫자가 안 나오나요? <br />
                        기존 아이콘을 지우고, 아래 [앱으로 설치] 버튼이 안 보이면 <br />
                        <b>크롬 메뉴(⋮) {'->'} [홈 화면에 추가]</b>를 눌러주세요!
                    </div>
                )}

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

                    {isSubscribed === false && (
                        <div style={{ marginTop: '5px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#c62828', fontWeight: 'bold' }}>
                                ⚠️ 숫자가 안 나오는 이유: 서버에 등록되지 않았습니다!
                            </p>
                            <button
                                onClick={registerPush}
                                style={{ width: '100%', padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                🔔 지금 서버에 등록하기 (클릭)
                            </button>
                            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666' }}>
                                * 위 버튼을 누른 후 '완료' 표시가 뜨면 숫자가 나오기 시작합니다.
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                            onClick={fetchUnread}
                            style={{ backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            🔄 숫자 새로고침
                        </button>
                        <button
                            onClick={() => testBadge(5)}
                            style={{ backgroundColor: '#e8f5e9', border: '1px solid #4caf50', color: '#2e7d32', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            🧪 배지 테스트(5)
                        </button>
                        <button
                            onClick={clearBadge}
                            style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            🧹 배지 지우기
                        </button>
                        <button
                            onClick={async () => {
                                const res = await sendTestPushAction();
                                if (res.success) alert(res.message);
                                else alert('오류: ' + res.message);
                            }}
                            style={{ backgroundColor: '#fff3e0', border: '1px solid #ff9800', color: '#e65100', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            🚀 실제 푸시 테스트
                        </button>
                        <button
                            onClick={() => window.location.href = `/dashboard?v=${Date.now()}`}
                            style={{ backgroundColor: '#fff', border: '1px solid #ff9800', color: '#ff9800', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            ⚡ 강제 업데이트
                        </button>
                    </div>

                    <div style={{ fontSize: '11px', color: '#888' }}>
                        기기 배지 지원: {typeof navigator !== 'undefined' && 'setAppBadge' in navigator ? <span style={{ color: 'green' }}>✅ 지원됨</span> : <span style={{ color: 'red' }}>❌ 미지원</span>} |
                        키 상태: {vapidPublicKey ? <span style={{ color: 'green' }}>✅ 있음({vapidPublicKey.length})</span> : <span style={{ color: 'red' }}>❌ 없음</span>}
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
        </main >
    );
}
