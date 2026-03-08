'use client';

import { useState, useEffect, useTransition, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPostByIdAction, updatePostAction } from '@/app/board/actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminNoticeEdit({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('관리자 로그인이 필요합니다.');
            router.push('/login');
            return;
        }

        async function loadNotice() {
            if (isLoaded) return;
            const found = await getPostByIdAction(Number(id));
            if (found) {
                setTitle(found.title);
                setContent(found.content);
                setIsLoaded(true);
            }
        }
        loadNotice();
    }, [id, router, isLoaded]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const result = await updatePostAction(Number(id), title, content);
            if (result.success) {
                alert('수정되었습니다.');
                router.push('/admin/notices/manage');
            } else {
                alert(result.message || '수정 중 오류가 발생했습니다.');
            }
        });
    };

    return (
        <AdminGuard>
            <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
                <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ color: 'var(--accent-primary)' }}>공지사항 수정</h1>
                    <Link href="/admin/notices/manage" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>취소</Link>
                </header>

                <form className="card" onSubmit={handleUpdate}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ width: '100%', height: '200px', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                            required
                        />
                    </div>

                    <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', height: '60px', fontSize: '24px' }}>
                        {isPending ? '수정 중...' : '확인 (수정 완료)'}
                    </button>
                </form>
            </main>
        </AdminGuard>
    );
}
