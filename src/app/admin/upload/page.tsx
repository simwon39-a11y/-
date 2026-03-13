'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { uploadExcelAction } from './actions';
import AdminGuard from '@/components/AdminGuard';

export default function AdminUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; count: number; message?: string; detectedHeaders?: string[] } | null>(null);

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
                if (!res.success) {
                    alert(`업로드 실패: ${res.message}`);
                }
            } catch (error: any) {
                alert('업로드 중 통신 오류가 발생했습니다.');
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
                        {isPending ? '등록 중...' : '데이터 등록하기'}
                    </button>

                    {result && (
                        <div style={{
                            marginTop: 'var(--spacing-md)',
                            padding: '15px',
                            background: result.success && result.count > 0 ? '#e8f5e9' : '#ffebee',
                            color: result.success && result.count > 0 ? '#2e7d32' : '#c62828',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>
                            {result.success && result.count > 0 ? (
                                `총 ${result.count}명의 회원이 성공적으로 등록되었습니다!`
                            ) : (
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ textAlign: 'center', marginBottom: '10px' }}>
                                        {result.success ? '등록된 회원이 0명입니다.' : '업로드에 실패했습니다.'}
                                    </p>
                                    {!result.success && result.message && (
                                        <p style={{ color: '#c62828', fontSize: '14px', marginBottom: '10px', textAlign: 'center' }}>
                                            오류 내용: {result.message}
                                        </p>
                                    )}
                                    <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                                        <strong>[원인 분석]</strong> 서버가 읽어낸 엑셀 제목은 다음과 같습니다:<br />
                                        <div style={{ background: '#fff', padding: '5px', borderRadius: '4px', margin: '5px 0', wordBreak: 'break-all' }}>
                                            {result.detectedHeaders && result.detectedHeaders.length > 0
                                                ? result.detectedHeaders.join(', ')
                                                : '제목을 읽지 못했습니다.'}
                                        </div>
                                        제목 중에 <strong>'성명'</strong>(또는 이름)과 <strong>'핸드폰'</strong>(또는 전화번호)이라는 단어가 포함되어 있어야 합니다. <br />
                                        엑셀의 가장 첫 번째 줄에 이 제목들이 있는지 확인해 주세요.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>도움말</h3>
                    <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        <li>엑셀의 첫 번째 칸은 '성명', 두 번째 칸은 '핸드폰' 형식이면 무조건 인식합니다.</li>
                        <li>파일 선택 후 '데이터 등록하기' 버튼을 꼭 눌러주셔야 합니다.</li>
                    </ul>
                </section>
            </main>
        </AdminGuard >
    );
}
