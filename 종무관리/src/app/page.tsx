import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--accent-primary)', marginBottom: '10px', fontSize: '32px' }}>
          관리자 시스템
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
          경기남부종무원 관리용 페이지
        </p>
      </header>

      <section className="card" style={{ marginBottom: '30px', border: '2px solid var(--accent-primary)' }}>
        <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🛠️</span> 주요 관리 도구
        </h2>
        <p style={{ marginBottom: '20px', color: '#555', lineHeight: '1.6' }}>
          회원 데이터 관리 및 공지사항, 게시판 관리.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📊  대시보드
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link href="/admin/upload" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', padding: '15px' }}>
              📁 엑셀 업로드
            </Link>
            <Link href="/board" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center', padding: '15px' }}>
              📱 게시판 바로가기
            </Link>
          </div>

          <Link href="/admin/notices/manage" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa' }}>
            📢 공지사항 및 게시물 관리 (수정/삭제)
          </Link>
        </div>
      </section>

      <section className="card" style={{ backgroundColor: '#fffdee', border: '1px solid #ffeeba' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '18px', color: '#856404' }}>💡 관리자 도움말</h3>
        <ul style={{ paddingLeft: '20px', color: '#856404', fontSize: '14px', lineHeight: '1.8' }}>
          <li>엑셀 업로드 시 기존 서식을 유지해 주세요.</li>
          <li>공지사항 작성 후 게시판에서 정상 노출을 확인해 주세요.</li>
          <li>사용자 로그인은 대시보드 내의 '입장하기'를 통해서도 가능합니다.</li>
        </ul>
      </section>

      <footer style={{ marginTop: '50px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
        © 경기남부 종무원 운영관리      </footer>
    </main>
  );
}
