import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '레벨메이트 — PC방 게임 동행 매칭',
    short_name: '레벨메이트',
    description:
      '게임 친구가 필요할 때, 레벨메이트. 제휴 PC방에서 안전하게 만나는 게임 동행 매칭 플랫폼.',
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
