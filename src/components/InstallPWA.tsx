'use client';

import { useState, useEffect } from 'react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isKakaotalk, setIsKakaotalk] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.includes('kakaotalk')) {
            setIsKakaotalk(true);
        }

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
        if (isKakaotalk) {
            // 카카오톡 탈출 로직
            const url = window.location.href.replace(/^https?:\/\//, '');
            if (window.navigator.userAgent.match(/Android/i)) {
                // 안드로이드: 크롬 브라우저 강제 실행 시도
                window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
            } else {
                // iOS 등: 수동 안내 표시
                setShowGuide(!showGuide);
            }
            return;
        }

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
                backgroundColor: isKakaotalk ? '#FEE500' : '#FFD700',
                color: '#333',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                border: isKakaotalk ? '3px solid #E6CF00' : '3px solid #DAA520',
                transition: 'transform 0.2s'
            }} onClick={handleInstallClick}>
                <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>
                    {isKakaotalk
                        ? '1️⃣ 설치 1단계: 이곳을 누르세요'
                        : (deferredPrompt ? '📲 바탕화면에 앱 설치하기' : (
                            <span>2️⃣ 2단계 설치 버튼이 안 보이면 <span style={{ fontSize: '26px', color: '#B8860B' }}>클릭</span></span>
                        ))}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>
                    {isKakaotalk
                        ? '눌러서 크롬으로 이동 후 2단계를 진행하세요.'
                        : (deferredPrompt
                            ? '아이콘만 누르면 즉시 열리는 전용 앱 설치'
                            : (showGuide ? '접기 ▲' : '수동으로 설치 하는 법'))}
                </div>
            </div>

            {(showGuide || isKakaotalk) && !deferredPrompt && (
                <div className="card" style={{
                    marginTop: '10px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    border: '2px dashed #DAA520',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s'
                }}>
                    <h3 style={{ fontSize: '18px', color: '#B8860B', marginBottom: '15px' }}>
                        {isKakaotalk ? '✅ 설치 2단계 안내' : (isIOS ? '2️⃣ 설치 2단계: 아이폰 수동 설치' : '2️⃣ 수동 설치 단계')}
                    </h3>

                    {isKakaotalk ? (
                        <div style={{ lineHeight: '1.8', fontSize: '16px' }}>
                            <p style={{ color: '#E65100', fontWeight: 'bold', marginBottom: '10px' }}>
                                카카오톡을 탈출하여 진짜 인터넷 창으로 갑니다!
                            </p>
                            <ol style={{ paddingLeft: '20px' }}>
                                <li>위의 <b>[1단계 버튼]</b>을 누르면 크롬 브라우저가 열립니다.</li>
                                <li>크롬이 열리면 나타나는 <b>[앱 설치하기]</b>를 누르면 성공!</li>
                                <li style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>※ 만약 반응이 없다면 오른쪽 위 <b>점 3개(⋮)</b>를 눌러 <b>[다른 브라우저로 열기]</b>를 선택하세요.</li>
                            </ol>
                        </div>
                    ) : isIOS ? (
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '16px' }}>
                            <li>하단 중앙의 <b>[공유 버튼]</b>(네모 위 화살표)을 누릅니다.</li>
                            <li>메뉴를 아래로 내려 <b>[홈 화면에 추가]</b>를 누릅니다.</li>
                            <li>오른쪽 상단의 <b>[추가]</b>를 누르면 성공!</li>
                            <li>4️⃣ 바탕화면에 <img src="/icons/icon-192x192.png" alt="아이콘" style={{ width: '48px', height: '48px', verticalAlign: 'middle', borderRadius: '12px', margin: '5px 10px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }} /> <b>아이콘</b>이 생겼습니다.</li>
                        </ol>
                    ) : (
                        <ol style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '16px' }}>
                            <li>1. 우측 상단의 <b>[점 3개(⋮)]</b> 누름</li>
                            <li>2. <b>[홈 화면에 추가]</b> 를 찾아 선택</li>
                            <li>3. 팝업창이 뜨면 <b>[추가]</b> 또는 <b>[설치]</b>를 누르세요.</li>
                            <li>4️⃣ 바탕화면에 <img src="/icons/icon-192x192.png" alt="아이콘" style={{ width: '48px', height: '48px', verticalAlign: 'middle', borderRadius: '12px', margin: '5px 10px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }} /> <b>아이콘</b>이 생겼습니다.</li>
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
