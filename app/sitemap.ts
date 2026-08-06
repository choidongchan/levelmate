import type { MetadataRoute } from 'next'
import { MATES } from '@/lib/data'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
    ...MATES.map((m) => ({
      url: `${SITE_URL}/mates/${m.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
