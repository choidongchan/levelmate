import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 무중단 배포용. 실행 중인 .next 를 건드리지 않고 다른 곳에 빌드한 뒤
  // 원자적으로 교체한다. 평소에는 기본값 .next 를 쓴다.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // levelmate.co.kr 로 들어와도 www 로 모아준다. (호스팅에서 처리한다면 지워도 무방)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'levelmate.co.kr' }],
        destination: 'https://www.levelmate.co.kr/:path*',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // 서비스 워커는 절대 캐시하지 않는다. PC방처럼 여러 사람이
        // 같은 PC를 쓰는 환경에서 옛 버전이 남아 있으면 곤란하다.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ]
  },
}

export default nextConfig
