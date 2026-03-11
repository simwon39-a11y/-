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
  title: "종무관리 시스템",
  description: "불교 사찰 회원 및 종무 관리 시스템",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "종무관리",
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
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
    <html lang="en" suppressHydrationWarning>
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
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    registration.onupdatefound = () => {
                      const installingWorker = registration.installing;
                      if (installingWorker) {
                        installingWorker.onstatechange = () => {
                          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 새로운 서비스 워커가 설치되면 한 번만 새로고침
                            console.log('New ServiceWorker found, reloading...');
                            window.location.reload(); 
                          }
                        };
                      }
                    };
                  }).catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
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


