'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { getPostsByCategoryAction, createCommentAction } from './actions';
import { PostCategory } from '@prisma/client';

export default function BoardList() {
    const [notices, setNotices] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [freePosts, setFreePosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
    const [isPending, startTransition] = useTransition();

    // 현재 접속한 사용자 정보 (임시로 localStorage에서 가져오거나 관리자로 설정)
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        async function loadAllPosts() {
            const [nData, rData, fData] = await Promise.all([
                getPostsByCategoryAction('NOTICE'),
                getPostsByCategoryAction('RESOURCE'),
                getPostsByCategoryAction('FREE')
            ]);
            setNotices(nData);
            setResources(rData);
            setFreePosts(fData);
            setIsLoading(false);
        }
        loadAllPosts();
    }, []);

    const toggleNotice = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleImageClick = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        setPreviewImage(url);
    };

    const handleCommentSubmit = async (postId: number) => {
        if (!currentUser) return alert('로그인이 필요합니다.');
        const text = commentText[postId];
        if (!text) return;

        startTransition(async () => {
            const res = await createCommentAction(postId, currentUser.id, text);
            if (res.success) {
                setCommentText(prev => ({ ...prev, [postId]: '' }));
                // 소식 다시 불러오기
                const rData = await getPostsByCategoryAction('RESOURCE');
                setResources(rData);
            }
        });
    };

    const renderPost = (post: any, showContent: boolean) => (
        <div key={post.id} className="card" style={{ marginBottom: '15px', border: expandedId === post.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
            <div onClick={() => toggleNotice(post.id)} style={{ cursor: 'pointer' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>{post.title}</h3>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {post.author?.buddhistName ? `${post.author.buddhistName} ` : ''}{post.author?.name || '익명'} · {new Date(post.createdAt).toLocaleDateString()}
                </div>

                {/* 사진 미리보기 */}
                {post.images && post.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', marginBottom: '10px' }}>
                        {post.images.map((img: any) => (
                            <img
                                key={img.id}
                                src={img.url}
                                onClick={(e) => handleImageClick(e, img.url)}
                                style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
                            />
                        ))}
                    </div>
                )}

                {/* 내용 노출 (공지사항은 상시 노출, 나머지는 클릭 시) */}
                {(showContent || expandedId === post.id) && (
                    <div style={{ fontSize: '18px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginTop: '10px', color: '#333' }}>
                        {post.content || '내용이 없습니다.'}
                    </div>
                )}
            </div>

            {/* 답글(댓글) 영역 - 불교 자료 게시판만 */}
            {post.category === 'RESOURCE' && expandedId === post.id && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>답글 ({post.comments.length})</h4>
                    {post.comments.map((comment: any) => (
                        <div key={comment.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dotted #ccc' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{comment.author.buddhistName ? `${comment.author.buddhistName} ` : ''}{comment.author.name}</div>
                            <div style={{ fontSize: '16px' }}>{comment.text}</div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <input
                            type="text"
                            placeholder="답글을 입력하세요"
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button onClick={() => handleCommentSubmit(post.id)} className="btn btn-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>등록</button>
                    </div>
                </div>
            )}
        </div>
    );

    const [noticeLimit, setNoticeLimit] = useState(5);
    const [resourceLimit, setResourceLimit] = useState(5);
    const [freeLimit, setFreeLimit] = useState(5);

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)' }}>신행 및 소식</h1>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
            </header>

            {isLoading ? (
                <p style={{ textAlign: 'center', padding: '50px' }}>정보를 불러오는 중입니다...</p>
            ) : (
                <>
                    {/* 1. 공지사항 섹션 */}
                    <section style={{ marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '24px', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '5px', marginBottom: '15px' }}>📢 공지사항</h2>
                        {notices.slice(0, noticeLimit).map(post => renderPost(post, true))}

                        {notices.length > noticeLimit && (
                            <button
                                onClick={() => setNoticeLimit(prev => prev + 10)}
                                className="btn"
                                style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}
                            >
                                공지사항 더보기 (현재 {noticeLimit}/{notices.length}) ▼
                            </button>
                        )}
                    </section>

                    {/* 2. 불교 자료 게시판 섹션 */}
                    <section style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4caf50', marginBottom: '15px', paddingBottom: '5px' }}>
                            <h2 style={{ fontSize: '24px', margin: 0 }}>📖 불교 자료</h2>
                            <Link href="/board/new?cat=RESOURCE" style={{ textDecoration: 'none', color: '#4caf50', fontWeight: 'bold' }}>[글쓰기]</Link>
                        </div>
                        {resources.slice(0, resourceLimit).map(post => renderPost(post, false))}

                        {resources.length > resourceLimit && (
                            <button
                                onClick={() => setResourceLimit(prev => prev + 10)}
                                className="btn"
                                style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}
                            >
                                자료 더보기 (현재 {resourceLimit}/{resources.length}) ▼
                            </button>
                        )}
                    </section>

                    {/* 3. 자유게시판 섹션 */}
                    <section style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2196f3', marginBottom: '15px', paddingBottom: '5px' }}>
                            <h2 style={{ fontSize: '24px', margin: 0 }}>💬 자유게시판</h2>
                            <Link href="/board/new?cat=FREE" style={{ textDecoration: 'none', color: '#2196f3', fontWeight: 'bold' }}>[글쓰기]</Link>
                        </div>
                        {freePosts.slice(0, freeLimit).map(post => renderPost(post, false))}

                        {freePosts.length > freeLimit && (
                            <button
                                onClick={() => setFreeLimit(prev => prev + 10)}
                                className="btn"
                                style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}
                            >
                                게시글 더보기 (현재 {freeLimit}/{freePosts.length}) ▼
                            </button>
                        )}
                    </section>
                </>
            )}

            {/* 이미지 미리보기 모달 (전역 공통) */}
            {previewImage && (
                <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
                    <img src={previewImage} style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '8px' }} />
                </div>
            )}

            {/* 글쓰기 버튼 (일반 회원용) */}
            <div style={{ position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <Link href="/board/new" className="btn btn-primary" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)', padding: '15px 30px', fontSize: '20px', textDecoration: 'none' }}>
                    글쓰기 ✍️
                </Link>
            </div>
        </main>
    );
}
