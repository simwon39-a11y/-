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
  manifest: "/manifest.json?v=26.03.13.v12.2005",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "종무 소통 시스템",
  },
};

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
                  const swUrl = '/sw.js?v=26.03.13.v12.2005';
                  navigator.serviceWorker.register(swUrl).then(function(registration) {
                    console.log('SW registered in 종무관리 with timestamp:', swUrl);
                    
                    registration.onupdatefound = () => {
                      const installingWorker = registration.installing;
                      if (installingWorker) {
                        installingWorker.onstatechange = () => {
                          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New version in 종무관리 detected, refreshing...');
                            window.location.reload(); 
                          }
                        };
                      }
                    };
                  }).catch(function(err) {
                    console.log('SW registration error in 종무관리:', err);
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


