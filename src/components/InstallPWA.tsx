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

        // 전역에 이미 캡처된 것이 있는지 확인
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const readyHandler = () => {
            if ((window as any).deferredPrompt) {
                setDeferredPrompt((window as any).deferredPrompt);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('prompt-ready', readyHandler);

        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('prompt-ready', readyHandler);
        };
    }, []);


    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // 설치 프롬프트가 지원되지 않는 경우 (iOS 등) 안내 메시지
            if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
                alert('아이폰(iOS) 전용 설치 방법: \n\n1. 브라우저 하단 공유 버튼(위로 화살표 네모) 클릭 \n2. "홈 화면에 추가" 클릭 \n3. 아이콘 생성 완료!');
            } else {
                alert('이 브라우저는 자동 설치를 지원하지 않거나 이미 설치되어 있습니다. \n브라우저 설정 메뉴에서 "홈 화면에 추가"를 눌러주세요.');
            }
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled) return null;

    return (
        <div style={{
            padding: '15px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.3)'
        }} onClick={handleInstallClick}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                {deferredPrompt ? '📲 앱으로 설치하여 사용하기' : '❓ 앱 설치 방법 확인하기 (클릭)'}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
                {deferredPrompt
                    ? '바탕화면에 아이콘을 만들고 알림을 받아보세요'
                    : '아이폰이나 설치 버튼이 안 뜨는 경우 클릭하세요'}
            </div>
        </div>
    );
}
