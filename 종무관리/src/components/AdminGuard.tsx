'use client';

import { useState, useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const auth = sessionStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        // 실제 운영 환경에서는 서버 액션을 통해 검증하는 것이 좋으나, 
        // 사용자의 요청에 따라 클라이언트 사이드에서 간단히 구현합니다.
        // 비밀번호는 .env에 설정된 quddlf338833 입니다.
        if (password === 'quddlf338833') {
            sessionStorage.setItem('admin_auth', 'true');
            setIsAuthorized(true);
            setError('');
        } else {
            setError('비밀번호가 올바르지 않습니다.');
        }
    };

    if (isAuthorized) {
        return <>{children}</>;
    }

    return (
        <main style={{ padding: 'var(--spacing-lg)', maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}>
            <div className="card">
                <h2 style={{ marginBottom: '20px', color: 'var(--accent-primary)' }}>관리자 인증</h2>
                <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>계속하려면 비밀번호를 입력하세요.</p>

                <form onSubmit={handleVerify}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호 입력"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '18px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '15px'
                        }}
                        autoFocus
                    />
                    {error && <p style={{ color: '#ff4d4f', marginBottom: '15px', fontSize: '14px' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '50px' }}>
                        확인
                    </button>
                </form>
            </div>
        </main>
    );
}
