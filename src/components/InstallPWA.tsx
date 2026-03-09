'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // 이미 설치되어 있는지 확인
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
            console.log('PWA was installed');
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled || !deferredPrompt) return null;

    return (
        <div style={{
            padding: '15px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            cursor: 'pointer'
        }} onClick={handleInstallClick}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>📲 앱으로 설치하여 사용하기</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>바탕화면에 아이콘을 만들고 알림을 받아보세요 (클릭)</div>
        </div>
    );
}
