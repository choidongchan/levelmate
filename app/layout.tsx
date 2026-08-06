import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { ServiceWorker } from '@/components/service-worker'
import { SideNav } from '@/components/side-nav'
import { StoreProvider } from '@/components/store-provider'
import { safeSnapshot } from '@/lib/server/snapshot'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 게임 알려주고, 배우고, 같이하고`,
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
    title: `${SITE_NAME} — 게임 알려주고, 배우고, 같이하고`,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — 게임 알려주고, 배우고, 같이하고`,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

// 사람마다 보이는 게 다르다. 미리 그려두면 남의 화면이 보인다.
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#06060a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 서버에서 데이터를 한 벌 실어 보낸다. 첫 화면이 비어 보이지 않고,
  // 브라우저가 따로 한 번 더 받아올 필요도 없다.
  const initial = await safeSnapshot()

  return (
    <html lang="ko">
      <body className="antialiased">
        <StoreProvider initial={initial}>
          {/* 모바일은 한 컬럼 + 하단 탭, PC는 좌측 사이드바 + 넓은 본문으로 갈린다. */}
          <div className="mx-auto flex w-full max-w-[90rem] md:gap-2">
            <SideNav />
            <div className="relative flex min-h-dvh w-full max-w-md flex-col pb-28 md:max-w-none md:flex-1 md:pb-12">
              {children}
            </div>
          </div>
          <BottomNav />
        </StoreProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
