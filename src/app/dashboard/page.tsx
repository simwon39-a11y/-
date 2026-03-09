'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPostsByCategoryAction } from '@/app/board/actions';

import { useRouter } from 'next/navigation';
import PushSubscriptionHandler from '@/components/PushSubscriptionHandler';
import InstallPWA from '@/components/InstallPWA';



export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [latestNotice, setLatestNotice] = useState<any>(null);

    const [latestResource, setLatestResource] = useState<any>(null);
    const [latestFree, setLatestFree] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        setUser(JSON.parse(userStr));


        async function loadLatests() {
            const [notices, resources, frees] = await Promise.all([
                getPostsByCategoryAction('NOTICE'),
                getPostsByCategoryAction('RESOURCE'),
                getPostsByCategoryAction('FREE')
            ]);

            if (notices.length > 0) setLatestNotice(notices[0]);
            if (resources.length > 0) setLatestResource(resources[0]);
            if (frees.length > 0) setLatestFree(frees[0]);
        }
        loadLatests();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <InstallPWA />
            {user && <PushSubscriptionHandler userId={user.id} />}

            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>

                <h1 style={{ color: 'var(--accent-primary)', fontSize: '32px' }}>회원 전용 화면</h1>
            </header>

            {/* 1. 최신 공지사항 (기존 유지) */}
            <section className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h2 style={{ fontSize: '22px', color: 'var(--accent-primary)', margin: 0 }}>🔔 최근 공지사항</h2>
                    <Link href="/board" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>전체보기 {'>'}</Link>
                </div>
                {latestNotice ? (
                    <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{latestNotice.title}</h3>
                        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                            {latestNotice.content.length > 50 ? latestNotice.content.substring(0, 50) + '...' : latestNotice.content}
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
                {latestResource ? (
                    <div>
                        <Link href="/board" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{latestResource.title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {latestResource.author?.buddhistName ? `${latestResource.author.buddhistName} ` : ''}{latestResource.author?.name || '익명'} · {new Date(latestResource.createdAt).toLocaleDateString()}
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
                {latestFree ? (
                    <div>
                        <Link href="/board" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{latestFree.title}</h3>
                        </Link>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {latestFree.author?.buddhistName ? `${latestFree.author.buddhistName} ` : ''}{latestFree.author?.name || '익명'} · {new Date(latestFree.createdAt).toLocaleDateString()}
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
