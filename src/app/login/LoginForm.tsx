'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginAction } from './actions';
import InstallPWA from '@/components/InstallPWA';

export default function LoginForm() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(async () => {
            const res = await loginAction(name, phone);
            if (res.success) {
                // 로그인 정보 저장
                localStorage.setItem('user', JSON.stringify(res.user));
                alert(`${res.user?.name}님, 환영합니다!`);
                router.push('/dashboard');
            } else {
                alert(res.message);
            }
        });
    };

    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            <InstallPWA />
            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-primary)' }}>종무 소통 시스템</h1>
                <p style={{ color: 'var(--text-secondary)' }}>성함과 전화번호를 입력해 주세요</p>
                <div
                    onClick={async () => {
                        if (confirm('최신 버전을 강제로 불러오기 위해 캐시를 완전히 초기화하시겠습니까?')) {
                            const names = await caches.keys();
                            for (let name of names) await caches.delete(name);
                            if ('serviceWorker' in navigator) {
                                const regs = await navigator.serviceWorker.getRegistrations();
                                for (let r of regs) await r.unregister();
                            }
                            window.location.reload();
                        }
                    }}
                    style={{
                        fontSize: '14px',
                        color: '#fff',
                        background: 'DodgerBlue',
                        padding: '8px 15px',
                        borderRadius: '8px',
                        marginTop: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'inline-block'
                    }}
                >
                    [여기를 눌러 v7로 업데이트] <br />
                    현재 버전: 2026.03.13-v7
                </div>
            </header>


            <form className="card" onSubmit={handleLogin}>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>성함</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        disabled={isPending}
                        required
                    />
                </div>

                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>전화번호</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        disabled={isPending}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '60px', fontSize: '24px' }} disabled={isPending}>
                    {isPending ? '확인 중...' : '확인'}
                </button>
            </form>

            <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
                <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    처음 화면으로
                </Link>
            </div>
        </main>
    );
}
