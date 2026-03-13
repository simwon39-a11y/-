import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BadgeHandler from "@/components/BadgeHandler";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "종무 소통 시스템",
  description: "사찰 종무 소통 및 회원 관리 시스템",
  manifest: "/manifest.json?v=26.03.13.v4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "종무 소통 시스템",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 앱으로 실행 시 노란 박스를 0.1초도 보여주지 않기 위해 최상단에 배치합니다 */
            @media (display-mode: standalone) {
              #pwa-install-container { display: none !important; }
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BadgeHandler />
        {children}

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                // 커스텀 이벤트로 알림
                window.dispatchEvent(new Event('prompt-ready'));
              });

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // 무한 루프 방지를 위해 실시간 타임스탬프 대신 고정 버전을 사용합니다.
                  const swUrl = '/sw.js?v=26.03.13.v4';
                  navigator.serviceWorker.register(swUrl).then(function(registration) {
                    console.log('SW registered with timestamp:', swUrl);
                    
                    registration.onupdatefound = () => {
                      const installingWorker = registration.installing;
                      if (installingWorker) {
                        installingWorker.onstatechange = () => {
                          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New version detected through SW, refreshing...');
                            window.location.reload(); 
                          }
                        };
                      }
                    };
                  }).catch(function(err) {
                    console.log('SW registration error:', err);
                  });
                });
              }

            `,
          }}
        />
      </body>
    </html>
  );
}


