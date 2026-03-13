'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { uploadExcelAction } from './actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ success: boolean; message: string; count: number; debugInfo?: any[] } | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('excel-file', file);

        startTransition(async () => {
            const res = await uploadExcelAction(formData);
            setResult(res);
        });
    };

    return (
        <AdminGuard>
            <main style={{ padding: 'var(--spacing-md)', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                    <h1 style={{ color: 'var(--accent-primary)' }}>회원 명단 대량 등록</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>엑셀(.xlsx) 또는 CSV 파일을 업로드해 주세요.</p>
                </header>

                <section className="card">
                    <form onSubmit={handleUpload}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>파일 선택</label>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!file || isPending}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '50px', fontSize: '18px' }}
                        >
                            {isPending ? '등록 중...' : '업로드 시작'}
                        </button>
                    </form>

                    {result && (
                        <div style={{
                            marginTop: '20px',
                            padding: '20px',
                            borderRadius: '12px',
                            backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
                            color: result.success ? '#2e7d32' : '#c62828',
                            border: `1px solid ${result.success ? '#a5d6a7' : '#ef9a9a'}`
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{result.success ? '결과' : '오류 발성'}</h3>
                            <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{result.message}</p>
                            <p>처리된 인원: <strong>{result.count}명</strong></p>

                            {result.debugInfo && (
                                <div style={{ marginTop: '20px', padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', overflowX: 'auto' }}>
                                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>▼ 서버가 읽어낸 파일 내용 예시 (진단용)</p>
                                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                {Object.keys(result.debugInfo[0] || {}).map(k => (
                                                    <th key={k} style={{ border: '1px solid #eee', padding: '4px', background: '#f9f9f9' }}>{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.debugInfo.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((v: any, j) => (
                                                        <td key={j} style={{ border: '1px solid #eee', padding: '4px' }}>{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        ← 대시보드로 돌아가기
                    </Link>
                </div>

                <footer style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', color: '#ccc', fontSize: '12px' }}>
                    시스템 버전: 2026.03.13-v6 (정밀 진단 모드)
                </footer>
            </main>
        </AdminGuard >
    );
}
