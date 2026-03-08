'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPostsByCategoryAction, deletePostAction } from '@/app/board/actions';

export default function AdminNoticeManage() {
    const [notices, setNotices] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('관리자 로그인이 필요합니다.');
            router.push('/login');
            return;
        }
        loadNotices();
    }, [router]);

    async function loadNotices() {
        const data = await getPostsByCategoryAction('NOTICE');
        setNotices(data);
    }

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`'${title}' 공지사항을 정말 삭제하시겠습니까?`)) return;

        startTransition(async () => {
            const res = await deletePostAction(id);
            if (res.success) {
                alert('삭제되었습니다.');
                loadNotices();
            } else {
                alert('삭제 실패: ' + res.message);
            }
        });
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)' }}>공지사항 관리</h1>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)' }}>
                {notices.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>등록된 공지사항이 없습니다.</p>
                ) : (
                    notices.map((notice) => (
                        <div key={notice.id} className="card" style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '22px', marginBottom: '10px' }}>{notice.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                                {notice.content ? (notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content) : '내용 없음'}
                            </p>
                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '10px' }}>
                                작성자: {notice.author?.buddhistName ? `${notice.author.buddhistName} ` : ''}{notice.author?.name || '익명'}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Link href={`/admin/notices/edit/${notice.id}`} className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', backgroundColor: '#e0e0e0', color: '#333' }}>
                                    수정하기
                                </Link>
                                <button
                                    onClick={() => handleDelete(notice.id, notice.title)}
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
                <Link href="/admin/notices" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    ➕ 새 공지사항 작성
                </Link>
            </div>
        </main>
    );
}
