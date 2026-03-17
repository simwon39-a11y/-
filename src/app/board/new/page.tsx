'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPostAction } from '../actions';

type PostCategory = 'NOTICE' | 'RESOURCE' | 'FREE';

// 클라이언트 사이드 이미지 압축 함수
const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1600; // 최대 해상도를 1600px으로 상향

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(blob || file); // 실패 시 원본 반환
                }, 'image/jpeg', 0.85); // 85% 품질로 상향
            };
        };
    });
};

function NewPostForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCat = (searchParams.get('cat') as PostCategory) || 'FREE';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<PostCategory>(initialCat);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        } else {
            alert('로그인이 필요합니다.');
            router.push('/login');
        }
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + selectedFiles.length > 4) {
                alert('사진은 최대 4장까지 첨부할 수 있습니다.');
                return;
            }
            const newFiles = [...selectedFiles, ...files];
            setSelectedFiles(newFiles);

            const filePreviews = files.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...filePreviews]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

        const newPreviews = [...previews];
        if (newPreviews[index]) {
            URL.revokeObjectURL(newPreviews[index]);
        }
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', category);
        formData.append('authorId', currentUser.id.toString());

        // 이미지 압축 처리 후 FormData에 추가
        for (const file of selectedFiles) {
            const compressedBlob = await compressImage(file);
            // Blob을 전송할 때는 원본 파일명을 매개변수로 명시해주는 것이 좋습니다.
            formData.append('images', compressedBlob, file.name);
        }

        startTransition(async () => {
            const res = await createPostAction(formData);
            if (res.success) {
                alert('등록되었습니다.');
                window.location.href = '/board?cat=' + category;
            } else {
                alert(res.message);
            }
        });
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)' }}>새 글 작성</h1>
                <Link href="/board" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>취소</Link>
            </header>

            <form className="card" onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>게시판 선택</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PostCategory)}
                        style={{ width: '100%', padding: '12px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    >
                        <option value="RESOURCE">📖 불교 자료 게시판</option>
                        <option value="FREE">💬 자유게시판</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>제목</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 상세히 적어주세요"
                        style={{ width: '100%', height: '200px', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>사진 첨부 (최대 4장)</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        style={{ marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {previews.map((preview, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                                <img src={preview} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" disabled={isPending} className="btn btn-primary" style={{ width: '100%', height: '60px', fontSize: '24px' }}>
                    {isPending ? '등록 중...' : '올리기'}
                </button>
            </form>
        </main>
    );
}

export default function NewPostPage() {
    return (
        <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>불러오는 중...</div>}>
            <NewPostForm />
        </Suspense>
    );
}
