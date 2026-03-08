'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/app/board/actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminNoticeWrite() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const router = useRouter();

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        } else {
            alert('관리자 로그인이 필요합니다.');
            router.push('/login');
        }
    }, [router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (selectedFiles.length + files.length > 4) {
            alert('사진은 최대 4장까지만 올릴 수 있습니다.');
            return;
        }

        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 4));

        newFiles.forEach(file => {
            const previewUrl = URL.createObjectURL(file);
            setPreviews(prev => [...prev, previewUrl].slice(0, 4));
        });
    };

    const removeImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(previews[index]);
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', 'NOTICE');
        formData.append('authorId', currentUser.id.toString());
        selectedFiles.forEach((file) => {
            formData.append('images', file);
        });

        startTransition(async () => {
            const res = await createPostAction(formData);
            if (res.success) {
                alert('공지사항이 성공적으로 등록되었습니다.');
                router.push('/admin/notices/manage');
            } else {
                alert(res.message);
            }
        });
    };

    return (
        <AdminGuard>
            <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
                <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ color: 'var(--accent-primary)' }}>공지사항 작성</h1>
                    <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
                </header>

                <form className="card" onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>제목</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="공지 제목을 입력하세요"
                            style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>사진 첨부 (최대 4장 - 클릭하면 크게 보기)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={selectedFiles.length >= 4}
                            style={{ display: 'block', marginBottom: '10px' }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {previews.map((src: string, index: number) => (
                                <div key={index} style={{ position: 'relative', width: '100%', paddingTop: '100%', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img
                                        src={src}
                                        onClick={() => setPreviewImage(src)}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>내용</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="공지 내용을 입력하세요"
                            style={{ width: '100%', height: '200px', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                            required
                        />
                    </div>

                    <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', height: '60px', fontSize: '24px' }}>
                        {isPending ? '등록 중...' : '공지사항 올리기'}
                    </button>
                </form>

                {/* 이미지 크게 보기 모달 */}
                {previewImage && (
                    <div
                        onClick={() => setPreviewImage(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            cursor: 'zoom-out'
                        }}
                    >
                        <img
                            src={previewImage}
                            style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                fontSize: '24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}
            </main>
        </AdminGuard>
    );
}
