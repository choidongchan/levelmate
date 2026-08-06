import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { ServiceWorker } from '@/components/service-worker'

export const metadata: Metadata = {
  title: {
    default: '레벨메이트 — PC방 게임 동행 매칭',
    template: '%s · 레벨메이트',
  },
  description:
    '게임 친구가 필요할 때, 레벨메이트. 제휴 PC방에서 안전하게 만나는 게임 동행 매칭 플랫폼.',
  applicationName: '레벨메이트',
  manifest: '/manifest.webmanifest',
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: '레벨메이트',
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
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col border-line pb-24 md:border-x">
          {children}
        </div>
        <BottomNav />
        <ServiceWorker />
      </body>
    </html>
  )
}
