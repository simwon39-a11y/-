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
}

export default function DashboardClient({
    initialUser,
    initialNotices,
    initialResources,
    initialFrees
}: DashboardClientProps) {
    const [user] = useState<any>(initialUser);
    const router = useRouter();

    useEffect(() => {
        // 클라이언트 사이드 저장소도 동기화 (기존 코드와 호환성을 위해)
        if (initialUser) {
            localStorage.setItem('user', JSON.stringify(initialUser));
        }
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
            </header>

            {/* 1. 최신 공지사항 */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '22px', color: 'var(--accent-primary)', margin: 0 }}>🔔 최근 공지사항</h2>
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
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '1px solid #4caf50' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '20px', color: '#4caf50', margin: 0 }}>📖 최근 불교 자료</h2>
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
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '1px solid #2196f3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '20px', color: '#2196f3', margin: 0 }}>💬 최근 자유 게시글</h2>
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

                <Link href="/chat" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '20px', fontSize: '20px' }}>
                    💬 따뜻한 대화 (채팅)
                </Link>

                <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: '15px', fontSize: '16px', marginTop: '10px', backgroundColor: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer' }}>
                    로그아웃
                </button>
            </div>
        </main>
    );
}
