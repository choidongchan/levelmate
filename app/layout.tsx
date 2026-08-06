import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { ServiceWorker } from '@/components/service-worker'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — PC방 게임 동행 매칭`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — PC방 게임 동행 매칭`,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — PC방 게임 동행 매칭`,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#07070b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 모바일 폭을 기준으로 짜되, PC 전체화면에서는 가운데 정렬해 쓴다.
            PC방 모니터에서 열어도 한 손에 잡히는 레이아웃이 그대로 유지된다. */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col pb-28 md:border-x md:border-white/5">
          {children}
        </div>
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  )
}
