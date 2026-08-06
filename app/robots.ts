import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 개인 영역은 색인하지 않는다.
      disallow: ['/my', '/chat', '/bookings', '/offline'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
