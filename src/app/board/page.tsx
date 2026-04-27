'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPostsByCategoryAction, getPostDetailAction, createCommentAction } from './actions';
type PostCategory = 'NOTICE' | 'RESOURCE' | 'FREE';
import { trackMultipleBoardViewsAction } from '@/app/api/unread/actions';
import { refreshAppBadge } from '@/lib/badgeClient';


function BoardContent({ activeCategory }: { activeCategory: PostCategory | null }) {
    const [notices, setNotices] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [freePosts, setFreePosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
    const [previewImageState, setPreviewImageState] = useState<{ images: any[], currentIndex: number } | null>(null);
    const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
    const [isPending, startTransition] = useTransition();

    const [noticeLimit, setNoticeLimit] = useState(5);
    const [resourceLimit, setResourceLimit] = useState(5);
    const [freeLimit, setFreeLimit] = useState(5);

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        async function loadFilteredPosts() {
            setIsLoading(true);
            try {
                if (activeCategory) {
                    const data = await getPostsByCategoryAction(activeCategory as any, 15);
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
                    // 비차단식(Background) 업데이트 - 단일 요청으로 통합 (await 추가하여 레이스 컨디션 방지)
                    await trackMultipleBoardViewsAction([activeCategory as any]);
                } else {
                    const [nData, rData, fData] = await Promise.all([
                        getPostsByCategoryAction('NOTICE', 15),
                        getPostsByCategoryAction('RESOURCE', 15),
                        getPostsByCategoryAction('FREE', 15)
                    ]);
                    setNotices(nData);
                    setResources(rData);
                    setFreePosts(fData);

                    // 메인 게시판 진입 시에는 자동으로 읽음 처리하지 않음 (사용자성 개선)
                }
                // 읽음 처리가 완벽히 끝난 후 배지 갱신
                await refreshAppBadge();
            } catch (error) {
                console.error('Load posts error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadFilteredPosts();
    }, [activeCategory]);

    const loadMorePosts = async (category: PostCategory) => {
        const currentList = category === 'NOTICE' ? notices : category === 'RESOURCE' ? resources : freePosts;
        const setList = category === 'NOTICE' ? setNotices : category === 'RESOURCE' ? setResources : setFreePosts;
        const limit = category === 'NOTICE' ? noticeLimit : category === 'RESOURCE' ? resourceLimit : freeLimit;

        setIsLoading(true);
        try {
            const newData = await getPostsByCategoryAction(category as any, 10, currentList.length);
            setList(prev => [...prev, ...newData]);

            if (category === 'NOTICE') setNoticeLimit(prev => prev + 10);
            else if (category === 'RESOURCE') setResourceLimit(prev => prev + 10);
            else if (category === 'FREE') setFreeLimit(prev => prev + 10);
        } catch (error) {
            console.error(`Load more ${category} error:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePostInLists = (postId: number, detailedData: any) => {
        const updateList = (list: any[]) => list.map(p => p.id === postId ? { ...p, ...detailedData } : p);
        setNotices(prev => updateList(prev));
        setResources(prev => updateList(prev));
        setFreePosts(prev => updateList(prev));
    };

    const toggleId = async (postId: number) => {
        if (expandedId === postId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(postId);

        // 이미 데이터를 가져왔는지 확인 (content가 있으면 가져온 것으로 간주)
        const allPosts = [...notices, ...resources, ...freePosts];
        const post = allPosts.find(p => p.id === postId);

        if (post && !post.content) {
            setDetailLoadingId(postId);
            try {
                const detailedData = await getPostDetailAction(postId);
                if (detailedData) {
                    updatePostInLists(postId, detailedData);
                }
            } catch (err) {
                console.error('Fetch post detail error:', err);
            } finally {
                setDetailLoadingId(null);
            }
        }
    };

    const handleCommentSubmit = async (postId: number) => {
        if (!currentUser) return alert('로그인이 필요합니다.');
        const text = commentText[postId];
        if (!text) return;

        startTransition(async () => {
            const res = await createCommentAction(postId, currentUser.id, text);
            if (res.success) {
                setCommentText(prev => ({ ...prev, [postId]: '' }));
                // 댓글 갱신을 위해 상세 정보 다시 가져오기
                const detailedData = await getPostDetailAction(postId);
                if (detailedData) {
                    updatePostInLists(postId, detailedData);
                }
            }
        });
    };

    const renderPost = (post: any, showContent: boolean) => (
        <div key={post.id} className="card" style={{ marginBottom: '15px', border: expandedId === post.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
            <div onClick={() => toggleId(post.id)} style={{ cursor: 'pointer' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '5px' }}>{post.title}</h3>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {post.author?.buddhistName ? `${post.author.buddhistName} ` : ''}{post.author?.name || '익명'} · {new Date(post.createdAt).toLocaleDateString()}
                </div>

                {/* 지연 로딩 중 표시 */}
                {detailLoadingId === post.id && (
                    <div style={{ padding: '10px', color: 'var(--accent-primary)', fontSize: '14px', fontStyle: 'italic' }}>
                        내용을 불러오는 중... ✨
                    </div>
                )}

                {/* 사진 미리보기 (데이터가 있을 때만) */}
                {post.images && post.images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', marginBottom: '10px' }}>
                        {post.images.map((img: any) => (
                            <img
                                key={img.id}
                                src={img.url}
                                onClick={(e) => { e.stopPropagation(); setPreviewImageState({ images: post.images, currentIndex: post.images.findIndex((i: any) => i.id === img.id) }); }}
                                style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
                            />
                        ))}
                    </div>
                )}

                {/* 내용 노출 (공지는 기본 노출 정책 유지하되 데이터 없으면 위에서 로딩됨) */}
                {(showContent || expandedId === post.id) && post.content && (
                    <div style={{ fontSize: '18px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginTop: '10px', color: '#333' }}>
                        {post.content}
                    </div>
                )}
            </div>

            {/* 답글 영역 */}
            {post.category === 'RESOURCE' && expandedId === post.id && post.comments && (
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

    const isNoticeMode = activeCategory === 'NOTICE';
    const isResourceMode = activeCategory === 'RESOURCE';
    const isFreeMode = activeCategory === 'FREE';
    const isAllMode = !activeCategory;

    const mainTitle = isNoticeMode ? '공지사항' : isResourceMode ? '불교 자료' : isFreeMode ? '자유게시판' : '신행 및 소식';

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px 0', position: 'sticky', top: 0, zIndex: 10 }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '24px' }}>{mainTitle}</h1>
                <Link href="/dashboard" style={{
                    textDecoration: 'none', color: '#fff', backgroundColor: 'var(--text-secondary)',
                    padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>나가기 🚪</Link>
            </header>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>목록을 불러오는 중입니다...</p>
                </div>
            ) : (
                <>
                    {/* 공지사항 */}
                    {(isAllMode || isNoticeMode) && (
                        <section style={{ marginBottom: '40px' }}>
                            {isAllMode && <h2 style={{ fontSize: '24px', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '5px', marginBottom: '15px' }}>📢 공지사항</h2>}
                            {notices.length > 0 ? notices.map(post => renderPost(post, isNoticeMode)) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>공지사항이 없습니다.</p>}
                            {notices.length >= noticeLimit && (
                                <button onClick={() => loadMorePosts('NOTICE')} className="btn" style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}>
                                    공지사항 더보기 ▼
                                </button>
                            )}
                        </section>
                    )}

                    {/* 불교 자료 */}
                    {(isAllMode || isResourceMode) && (
                        <section style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #4caf50', marginBottom: '15px', paddingBottom: '5px' }}>
                                <h2 style={{ fontSize: '24px', margin: 0 }}>{isAllMode ? '📖 불교 자료' : '목록'}</h2>
                                <Link href="/board/new?cat=RESOURCE" style={{ textDecoration: 'none', color: '#4caf50', fontWeight: 'bold' }}>[글쓰기]</Link>
                            </div>
                            {resources.length > 0 ? resources.map(post => renderPost(post, false)) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>등록된 자료가 없습니다.</p>}
                            {resources.length >= resourceLimit && (
                                <button onClick={() => loadMorePosts('RESOURCE')} className="btn" style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}>
                                    자료 더보기 ▼
                                </button>
                            )}
                        </section>
                    )}

                    {/* 자유게시판 */}
                    {(isAllMode || isFreeMode) && (
                        <section style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2196f3', marginBottom: '15px', paddingBottom: '5px' }}>
                                <h2 style={{ fontSize: '24px', margin: 0 }}>{isAllMode ? '💬 자유게시판' : '목록'}</h2>
                                <Link href="/board/new?cat=FREE" style={{ textDecoration: 'none', color: '#2196f3', fontWeight: 'bold' }}>[글쓰기]</Link>
                            </div>
                            {freePosts.length > 0 ? freePosts.map(post => renderPost(post, false)) : <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>등록된 게시글이 없습니다.</p>}
                            {freePosts.length >= freeLimit && (
                                <button onClick={() => loadMorePosts('FREE')} className="btn" style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', marginTop: '10px' }}>
                                    게시글 더보기 ▼
                                </button>
                            )}
                        </section>
                    )}
                </>
            )}

            {previewImageState && (
                <div onClick={() => setPreviewImageState(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
                    {previewImageState.currentIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setPreviewImageState(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null); }}
                            style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', padding: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            &#10094;
                        </button>
                    )}
                    <img src={previewImageState.images[previewImageState.currentIndex].url} style={{ maxWidth: '85%', maxHeight: '85%', borderRadius: '8px', cursor: 'default' }} onClick={(e) => e.stopPropagation()} />
                    {previewImageState.currentIndex < previewImageState.images.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setPreviewImageState(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null); }}
                            style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', padding: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            &#10095;
                        </button>
                    )}
                    <div style={{ position: 'absolute', bottom: '20px', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                        {previewImageState.currentIndex + 1} / {previewImageState.images.length}
                    </div>
                </div>
            )}

            {isAllMode && (
                <div style={{ position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Link href="/board/new" className="btn btn-primary" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.2)', padding: '15px 30px', fontSize: '20px', textDecoration: 'none' }}>
                        글쓰기 ✍️
                    </Link>
                </div>
            )}
        </main>
    );
}

function BoardSearchParamsWrapper() {
    const searchParams = useSearchParams();
    const cat = searchParams.get('cat') as PostCategory | null;

    // key를 cat으로 설정하여 파라미터가 바뀔 때마다 컴포넌트를 새로 그림
    return <BoardContent key={cat || 'all'} activeCategory={cat} />;
}

export default function BoardPage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>화면을 준비 중입니다...</p>
            </div>
        }>
            <BoardSearchParamsWrapper />
        </Suspense>
    );
}
