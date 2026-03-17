'use client';

export default function VersionUpdateBtn() {
    return (
        <div
            onClick={async () => {
                if (confirm('최신 버전(v15)으로 즉시 업데이트하기 위해 모든 캐시를 삭제하시겠습니까?')) {
                    if ('caches' in window) {
                        const names = await caches.keys();
                        for (let name of names) await caches.delete(name);
                    }
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) await registration.unregister();
                    }
                    // 타임스탬프를 이용해 캐시 무시 강제 로드
                    window.location.href = '/?update=' + Date.now();
                }
            }}
            style={{
                fontSize: '18px',
                color: '#fff',
                background: 'DodgerBlue',
                padding: '10px 20px',
                borderRadius: '10px',
                marginTop: '15px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'inline-block',
                boxShadow: '0 4px 10px rgba(30, 144, 255, 0.3)'
            }}
        >
            [ 여기를 눌러 v17.2 최종 업데이트 완료 ] <br />
            현재 버전: 2026.03.14-v17.2 (동기화 삭제 누락 방어 로직 강화)
        </div>
    );
}
