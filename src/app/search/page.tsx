'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { searchMembersAction } from './actions';
import { formatPhoneNumber } from '@/lib/utils';

export default function MemberSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        startTransition(async () => {
            const members = await searchMembersAction(query);
            setResults(members);
        });
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)' }}>회원 및 사찰 검색</h1>
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>나가기</Link>
            </header>

            {/* 검색 영역 */}
            <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="성함, 법명, 사찰명 검색"
                        style={{ flex: 1, padding: '12px', fontSize: '18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }} disabled={isPending}>검색</button>
                </form>
            </div>

            {/* 결과 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {isPending ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색 중...</p>
                ) : results.length > 0 ? (
                    results.map((member) => {
                        // 검색어가 사찰명과 일치하는지 체크하여 '사찰 검색' 모드 판단
                        const isTempleSearch = query && member.temple?.includes(query);

                        return (
                            <div key={member.id} className="card" style={{
                                padding: '15px',
                                borderLeft: `4px solid ${isTempleSearch ? '#4a90e2' : 'var(--accent-primary)'}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '10px', gap: '8px' }}>
                                            <h2 style={{ color: 'var(--accent-primary)', fontSize: '32px', margin: 0 }}>{member.name}</h2>
                                        </div>

                                        {/* 상세 정보 표출: 성명, 법명, 법호, 법계, 소속사찰, 전화번호 */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px 15px', fontSize: '21px', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginTop: '5px' }}>

                                            {/* 법명 */}
                                            <div style={{ color: '#888' }}>법명</div>
                                            <div style={{ color: '#333', fontWeight: '500' }}>{member.buddhistName || '-'}</div>

                                            {/* 법호 / 법계 */}
                                            <div style={{ color: '#888' }}>법호 / 법계</div>
                                            <div style={{ color: '#333', fontWeight: '500' }}>
                                                {member.buddhistTitle || '-'}{' / '}{member.buddhistRank || '-'}
                                            </div>

                                            {/* 신분 / 직책 */}
                                            <div style={{ color: '#888' }}>신분 / 직책</div>
                                            <div style={{ color: '#333', fontWeight: '500' }}>
                                                {member.status || '-'}{' / '}{member.position || '-'}
                                            </div>

                                            {/* 소속 사찰 */}
                                            <div style={{ color: '#888' }}>소속 사찰</div>
                                            <div style={{ fontWeight: '600', color: '#333' }}>
                                                {member.temple || <span style={{ color: '#ccc', fontWeight: 'normal' }}>미지정</span>}
                                                {member.templePosition && <span style={{ marginLeft: '8px', fontWeight: 'normal', color: '#666', fontSize: '18px' }}>({member.templePosition})</span>}
                                            </div>

                                            {/* 연락처 */}
                                            <div style={{ color: '#888' }}>연락처</div>
                                            <div style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>{formatPhoneNumber(member.phone)}</div>
                                        </div>

                                        {/* 사찰 주소: 그리드 밖으로 빼서 가로 전체 너비 사용 */}
                                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '15px' }}>
                                            <div style={{ color: '#888', fontSize: '18px', marginBottom: '8px' }}>사찰 주소</div>
                                            <div style={{
                                                fontSize: '22px',
                                                lineHeight: '1.3',
                                                color: '#333',
                                                wordBreak: 'break-all',
                                                overflowWrap: 'break-word',
                                                whiteSpace: 'normal',
                                                display: 'block',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}>
                                                {member.templeAddress ? (
                                                    <>
                                                        {member.division && <span style={{ color: '#888', marginRight: '6px' }}>[{member.division}]</span>}
                                                        {member.templeAddress}
                                                    </>
                                                ) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '18px', display: 'flex', gap: '10px' }}>
                                    <a href={`tel:${member.phone.replace(/[^0-9]/g, '')}`} className="btn btn-secondary" style={{
                                        flex: 1,
                                        textDecoration: 'none',
                                        textAlign: 'center',
                                        padding: '15px',
                                        fontSize: '20px',
                                        fontWeight: '500',
                                        borderRadius: '8px',
                                        backgroundColor: '#f8f5f2',
                                        border: '1px solid #e8e0d8',
                                        color: '#705030'
                                    }}>전화하기</a>
                                    <Link href={`/chat?to=${member.id}`} className="btn btn-primary" style={{
                                        flex: 1,
                                        textDecoration: 'none',
                                        textAlign: 'center',
                                        padding: '15px',
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        borderRadius: '8px'
                                    }}>대화하기</Link>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    query && (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '60px 0' }}>
                            <p style={{ fontSize: '18px' }}>검색 결과가 없습니다.</p>
                            <p style={{ fontSize: '14px', marginTop: '10px', color: '#999' }}>성명, 법명, 또는 사찰명으로 다시 검색해 주세요.</p>
                        </div>
                    )
                )}
            </div>
        </main>
    );
}
