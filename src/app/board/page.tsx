'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPostsByCategoryAction, createCommentAction } from './actions';
import { PostCategory } from '@prisma/client';
import { trackBoardViewAction } from '@/app/api/unread/actions';
import { refreshAppBadge } from '@/lib/badgeClient';


export default function BoardPage() {

    const [notices, setNotices] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [freePosts, setFreePosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
    const [isPending, startTransition] = useTransition();

    const [noticeLimit, setNoticeLimit] = useState(5);
    const [resourceLimit, setResourceLimit] = useState(5);
    const [freeLimit, setFreeLimit] = useState(5);

    // 현재 접속한 사용자 정보
    const [currentUser, setCurrentUser] = useState<any>(null);

    const searchParams = useSearchParams();
    const activeCategory = searchParams.get('cat') as PostCategory | null;

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        async function loadFilteredPosts() {
            setIsLoading(true);
            try {
                if (activeCategory) {
                    // 특정 카테고리만 로딩
                    const data = await getPostsByCategoryAction(activeCategory, 30);
                    if (activeCategory === 'NOTICE') {
                        setNotices(data);
                        setResources([]);
                        setFreePosts([]);
                    } else if (activeCategory === 'RESOURCE') {
                        setResources(data);
                        setNotices([]);
                        setFreePosts([]);
                    } else if (activeCategory === 'FREE') {
                        setFreePosts(data);
                        setNotices([]);
                        setResources([]);
                    }

                    await trackBoardViewAction(activeCategory);
                } else {
                    // 카테고리 없으면 전체 로딩
                    const [nData, rData, fData] = await Promise.all([
                        getPostsByCategoryAction('NOTICE', 30),
                        getPostsByCategoryAction('RESOURCE', 30),
                        getPostsByCategoryAction('FREE', 30)
                    ]);
                    setNotices(nData);
                    setResources(rData);
                    setFreePosts(fData);

                    await trackBoardViewAction('NOTICE');
                    await trackBoardViewAction('RESOURCE');
                    await trackBoardViewAction('FREE');
                }

                // 앱 아이콘 숫자(배지) 즉시 갱신
                await refreshAppBadge();
            } catch (error) {
                console.error('Load posts error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadFilteredPosts();
    }, [activeCategory]);


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
                // 자료 다시 불러오기
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

                {/* 내용 노출 */}
                {(showContent || expandedId === post.id) && (
                    <div style={{ fontSize: '18px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginTop: '10px', color: '#333' }}>
                        {post.content || '내용이 없습니다.'}
                    </div>
                )}
            </div>

            {/* 답글 영역 */}
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

    const getTitle = () => {
        if (activeCategory === 'NOTICE') return '공지사항';
        if (activeCategory === 'RESOURCE') return '불교 자료';
        if (activeCategory === 'FREE') return '자유게시판';
        return '신행 및 소식';
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px 0', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '24px' }}>{getTitle()}</h1>
                <Link href="/dashboard" style={{
                    textDecoration: 'none',
                    color: '#fff',
                    backgroundColor: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>나가기 🚪</Link>
            </header>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>정보를 불러오는 중입니다...</p>
                </div>
            ) : (
                <>
                    {/* 1. 공지사항 섹션 */}
                    {(!activeCategory || activeCategory === 'NOTICE') && (
                        <section style={{ marginBottom: '40px' }}>
                            {!activeCategory && <h2 style={{ fontSize: '24px', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '5px', marginBottom: '15px' }}>📢 공지사항</h2>}
                            {notices.length > 0 ? (
                                notices.slice(0, noticeLimit).map(post => renderPost(post, true))
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>공지사항이 없습니다.</p>
                            )}

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
                    )}

                    {/* 2. 불교 자료 게시판 섹션 */}
                    {(!activeCategory || activeCategory === 'RESOURCE') && (
                        <section style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4caf50', marginBottom: '15px', paddingBottom: '5px' }}>
                                <h2 style={{ fontSize: '24px', margin: 0 }}>{!activeCategory ? '📖 불교 자료' : '목록'}</h2>
                                <Link href="/board/new?cat=RESOURCE" style={{ textDecoration: 'none', color: '#4caf50', fontWeight: 'bold' }}>[글쓰기]</Link>
                            </div>
                            {resources.length > 0 ? (
                                resources.slice(0, resourceLimit).map(post => renderPost(post, false))
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>등록된 자료가 없습니다.</p>
                            )}

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
                    )}

                    {/* 3. 자유게시판 섹션 */}
                    {(!activeCategory || activeCategory === 'FREE') && (
                        <section style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2196f3', marginBottom: '15px', paddingBottom: '5px' }}>
                                <h2 style={{ fontSize: '24px', margin: 0 }}>{!activeCategory ? '💬 자유게시판' : '목록'}</h2>
                                <Link href="/board/new?cat=FREE" style={{ textDecoration: 'none', color: '#2196f3', fontWeight: 'bold' }}>[글쓰기]</Link>
                            </div>
                            {freePosts.length > 0 ? (
                                freePosts.slice(0, freeLimit).map(post => renderPost(post, false))
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>등록된 게시글이 없습니다.</p>
                            )}

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
                    )}
                </>
            )}

            {/* 이미지 미리보기 모달 */}
            {previewImage && (
                <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
                    <img src={previewImage} style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '8px' }} />
                </div>
            )}

            {/* 글쓰기 버튼 (전체 보기일 때만 하단에 둠) */}
            {!activeCategory && (
                <div style={{ position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Link href="/board/new" className="btn btn-primary" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)', padding: '15px 30px', fontSize: '20px', textDecoration: 'none' }}>
                        글쓰기 ✍️
                    </Link>
                </div>
            )}
        </main>
    );
}
