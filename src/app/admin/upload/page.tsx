'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { uploadExcelAction } from './actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{
        success: boolean;
        count: number;
        totalInFile?: number;
        isPartial?: boolean;
        message?: string;
        detectedHeaders?: string[]
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('excel-file', file);

        startTransition(async () => {
            try {
                const res = await uploadExcelAction(formData);
                setResult(res);
            } catch (error: any) {
                console.error('클라이언트 업로드 에러:', error);
                setResult({
                    success: false,
                    count: 0,
                    message: `통신 장애가 발생했습니다: ${error.message || '인터넷 연결을 확인해주세요.'}`
                });
            }
        });
    };

    return (
        <AdminGuard>
            <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
                <header style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '18px' }}>
                        ← 처음으로 돌아가기
                    </Link>
                    <h1 style={{ marginTop: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
                        엑셀 자료 등록
                    </h1>
                </header>

                <section className="card">
                    <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>1. 엑셀 파일 선택</h2>
                    <p style={{ marginBottom: 'var(--spacing-md)', fontSize: '18px' }}>
                        준비하신 '회원명단' 엑셀 파일을 아래 버튼을 눌러 선택해 주세요.
                    </p>

                    <input
                        type="file"
                        name="excel-file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        style={{ marginBottom: 'var(--spacing-md)', display: 'block', padding: '10px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    />

                    {file && (
                        <div style={{ marginBottom: 'var(--spacing-md)', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            선택된 파일: <strong>{file.name}</strong>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        className="btn btn-primary"
                        style={{ width: '100%', opacity: file ? 1 : 0.5 }}
                        disabled={!file || isPending}
                    >
                        {isPending ? '등록 중 (잠시만 기다려주세요)...' : '데이터 등록하기'}
                    </button>

                    {result && (
                        <div style={{
                            marginTop: 'var(--spacing-md)',
                            padding: '15px',
                            background: result.success && result.count > 0 ? (result.isPartial ? '#fff3e0' : '#e8f5e9') : '#ffebee',
                            color: result.success && result.count > 0 ? (result.isPartial ? '#e65100' : '#2e7d32') : '#c62828',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>
                            {result.success && result.count > 0 ? (
                                <>
                                    <p>{result.message}</p>
                                    <p style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '5px' }}>
                                        (이번 업로드 확인: {result.count}명)
                                    </p>
                                    {result.isPartial && (
                                        <p style={{ fontSize: '13px', fontWeight: 'normal', color: '#ff9800', marginTop: '10px' }}>
                                            ⚠️ 데이터가 너무 많아 안전을 위해 나누어 등록 중입니다. <br />
                                            동일한 파일을 한 번 더 업로드하면 남은 인원이 계속 등록됩니다.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ textAlign: 'center', marginBottom: '10px' }}>
                                        {result.success ? '등록된 회원이 0명입니다.' : '문제가 발생했습니다.'}
                                    </p>
                                    {result.message && (
                                        <div style={{
                                            background: '#fff',
                                            padding: '10px',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            marginBottom: '10px',
                                            color: '#d32f2f',
                                            border: '1px solid #ffcdd2'
                                        }}>
                                            <strong>[에러 메시지]</strong><br />
                                            {result.message}
                                        </div>
                                    )}
                                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                                        <strong>[진단]</strong> 서버가 읽어낸 엑셀 제목 목록:<br />
                                        <div style={{ background: '#fff', padding: '5px', borderRadius: '4px', margin: '5px 0', wordBreak: 'break-all' }}>
                                            {result.detectedHeaders && result.detectedHeaders.length > 0
                                                ? result.detectedHeaders.join(', ')
                                                : '제목을 읽지 못했습니다.'}
                                        </div>
                                        엑셀의 <strong>첫 줄</strong>에 '성명'과 '핸드폰'이라는 제목이 있는지 확인해 주세요.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <footer style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>
                    시스템 버전: 2026.03.13-v2 (타임아웃 방지 강화)
                </footer>
            </main>
        </AdminGuard >
    );
}
