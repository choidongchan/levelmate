import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '한판 — 같이 게임할 사람 찾기',
    short_name: '한판',
    description:
      '혼자보다 함께, 게임은 더 재밌다. 게임 알려주고 배우고 같이하는 사람들.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#07070b',
    theme_color: '#07070b',
    lang: 'ko',
    categories: ['social', 'games', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: '메이트 검색', url: '/search' },
      { name: '내 예약', url: '/bookings' },
    ],
  }
}
