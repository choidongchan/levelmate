import type { MetadataRoute } from 'next'
import { SEED_LISTINGS } from '@/lib/seed'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
    ...SEED_LISTINGS.map((l) => ({
      url: `${SITE_URL}/listings/${l.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
