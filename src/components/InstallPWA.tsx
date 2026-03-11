'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    const [showGuide, setShowGuide] = useState(false);

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
            setShowGuide(!showGuide);
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (isInstalled) return null;

    const isIOS = typeof window !== 'undefined' && (/iPhone|iPad|iPod/.test(window.navigator.userAgent));

    return (
        <div style={{ marginBottom: '25px' }}>
            <div style={{
                padding: '18px',
                backgroundColor: '#FFD700',
                color: '#333',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                border: '3px solid #DAA520',
                transition: 'transform 0.2s'
            }} onClick={handleInstallClick}>
                <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>
                    {deferredPrompt ? '📲 바탕화면에 앱 설치하기' : '❓ 설치 버튼이 안 보인다면? (클릭)'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {deferredPrompt
                        ? '아이콘만 누르면 즉시 열리는 전용 앱 설치'
                        : (showGuide ? '접기 ▲' : '안드로이드/아이폰 설치 방법 보기')}
                </div>
            </div>

            {showGuide && !deferredPrompt && (
                <div className="card" style={{
                    marginTop: '10px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    border: '2px dashed #DAA520',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s'
                }}>
                    <h3 style={{ fontSize: '18px', color: '#B8860B', marginBottom: '15px' }}>
                        {isIOS ? '🍎 아이폰 설치 방법' : '🤖 안드로이드 설치 방법'}
                    </h3>

                    {isIOS ? (
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '16px' }}>
                            <li>하단 중앙의 <b>[공유 버튼]</b>(네모 위 화살표)을 누릅니다.</li>
                            <li>메뉴를 아래로 내려 <b>[홈 화면에 추가]</b>를 누릅니다.</li>
                            <li>오른쪽 상단의 <b>[추가]</b>를 누르면 성공!</li>
                        </ol>
                    ) : (
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '16px' }}>
                            <li>상단 혹은 하단의 <b>[점 3개(⋮)]</b> 또는 <b>[선 3개(≡)]</b> 메뉴를 누릅니다.</li>
                            <li><b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b> 메뉴를 찾아서 누릅니다.</li>
                            <li>팝업창이 뜨면 <b>[설치]</b> 또는 <b>[추가]</b>를 누르세요.</li>
                        </ol>
                    )}

                    <p style={{ marginTop: '15px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                        ※ 카카오톡 등에서 열었다면 <b>[다른 브라우저로 열기]</b> 또는 <b>[Chrome으로 열기]</b>를 먼저 해주세요.
                    </p>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
