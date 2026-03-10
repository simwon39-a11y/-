import React from 'react';

export default function DashboardLoading() {
    return (
        <main style={{ padding: 'var(--spacing-md)', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header Skeleton */}
            <header style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <div style={{ height: '40px', background: '#f0f0f0', borderRadius: '8px', width: '70%', margin: '0 auto 10px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ height: '20px', background: '#f5f5f5', borderRadius: '4px', width: '50%', margin: '0 auto', animation: 'pulse 1.5s infinite' }}></div>
            </header>

            {/* Post Cards Skeletons */}
            {[1, 2, 3].map((i) => (
                <section key={i} className="card" style={{ marginBottom: 'var(--spacing-md)', minHeight: '120px', backgroundColor: '#fff', border: '1px solid #eee', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ height: '24px', background: '#f0f0f0', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }}></div>
                        <div style={{ height: '20px', background: '#f5f5f5', borderRadius: '4px', width: '15%', animation: 'pulse 1.5s infinite' }}></div>
                    </div>
                    <div style={{ height: '20px', background: '#f8f8f8', borderRadius: '4px', width: '90%', marginBottom: '10px', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ height: '20px', background: '#f8f8f8', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }}></div>
                </section>
            ))}

            {/* Quick Link Buttons Skeletons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <div style={{ height: '65px', background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ height: '65px', background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}} />
        </main>
    );
}
