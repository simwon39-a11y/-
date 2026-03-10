'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPostsByCategoryAction, deletePostAction } from '@/app/board/actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminNoticeManage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [category, setCategory] = useState<string>('NOTICE');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('관리자 로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        loadPosts();
    }, [router, category]);

    async function loadPosts() {
        const data = await getPostsByCategoryAction(category as any);
        setPosts(data);
    }

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`'${title}' 게시물을 정말 삭제하시겠습니까?`)) return;

        startTransition(async () => {
            const res = await deletePostAction(id);
            if (res.success) {
                alert('삭제되었습니다.');
                loadPosts();
            } else {
                alert('삭제 실패: ' + res.message);
            }
        });
    };

    const categories = [
        { id: 'NOTICE', label: '📢 공지사항' },
        { id: 'RESOURCE', label: '📖 불교자료' },
        { id: 'FREE', label: '💬 자유게시판' }
    ];

    return (
        <AdminGuard>
            <main style={{ padding: 'var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ color: 'var(--accent-primary)' }}>게시물 통합 관리</h1>
                    <Link href="/admin" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
                </header>

                {/* 카테고리 탭 */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            style={{
                                padding: '10px 15px',
                                borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: category === cat.id ? 'var(--accent-primary)' : 'white',
                                color: category === cat.id ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: category === cat.id ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}>
                    {posts.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>등록된 게시물이 없습니다.</p>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="card" style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{post.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '15px', lineHeight: '1.5' }}>
                                    {post.content ? (post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content) : '내용 없음'}
                                </p>
                                <div style={{ fontSize: '13px', color: '#999', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>작성자: {post.author?.buddhistName ? `${post.author.buddhistName} ` : ''}{post.author?.name || '익명'}</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Link href={`/admin/notices/edit/${post.id}`} className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', backgroundColor: '#e0e0e0', color: '#333' }}>
                                        수정하기
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(post.id, post.title)}
                                        disabled={isPending}
                                        className="btn"
                                        style={{ flex: 1, backgroundColor: '#ff4d4f', color: 'white' }}
                                    >
                                        삭제하기
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '30px' }}>
                    <Link
                        href={category === 'NOTICE' ? '/admin/notices' : `/board/new?cat=${category}`}
                        className="btn btn-primary"
                        style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}
                    >
                        ➕ 새 {categories.find(c => c.id === category)?.label.split(' ')[1]} 작성
                    </Link>
                </div>
            </main>
        </AdminGuard>
    );
}
