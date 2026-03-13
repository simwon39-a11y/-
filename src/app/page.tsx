import Link from 'next/link';
import InstallPWA from '@/components/InstallPWA';
import { getServerUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getServerUser();

  // 이미 로그인된 사용자라면 대시보드로 바로 보냅니다.
  if (user) {
    redirect('/dashboard');
  }

  return (

    <main style={{ padding: 'var(--spacing-md)', width: '100%', margin: '0' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--accent-primary)', marginBottom: '10px', fontSize: '36px' }}>
          종무 소통 시스템
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>
          경기남부종무원에 오신 것을 환영합니다
        </p>
        <div
          onClick={async () => {
            if (confirm('최신 버전으로 업데이트하기 위해 캐시를 삭제하고 다시 불러오시겠습니까?')) {
              const names = await caches.keys();
              for (let name of names) await caches.delete(name);
              if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) await registration.unregister();
              }
              window.location.reload(true as any);
            }
          }}
          style={{
            fontSize: '18px',
            color: '#fff',
            background: '#ff4d4f',
            padding: '10px 20px',
            borderRadius: '10px',
            marginTop: '15px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-block',
            boxShadow: '0 4px 10px rgba(255, 77, 79, 0.3)'
          }}
        >
          [ 여기를 눌러 업데이트 완료하기 ] <br />
          현재 버전: 26.03.13.v4
        </div>
      </header>


      <InstallPWA />

      <section className="card" style={{ marginBottom: '30px', textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
          편리한 종무 관리를 위해<br />로그인해 주세요
        </h2>
        <p style={{ marginBottom: '40px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          등록된 성함과 전화번호로<br />안전하게 접속하실 수 있습니다.
        </p>

        <Link href="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', borderRadius: '15px' }}>
          입장 하기
        </Link>
      </section>

      <section style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          처음 오셨나요? 상단의 앱 설치 버튼을 눌러<br />바탕화면에 아이콘을 만들면 더 편리합니다.
        </p>
      </section>

      {/* 관리자 링크 (개발 단계에서만 쉽게 접근하도록 하단에 배치) */}
      <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px' }}>
        <Link href="/admin" style={{ color: '#ccc', textDecoration: 'none' }}>
          [관리자 전용]
        </Link>
      </div>

      <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
        © 경기남부 종무원 운영관리
      </footer>
    </main>
  );
}
