import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const listings = await db.listing.findMany({
      where: { active: true },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return [
      ...base,
      ...listings.map((l) => ({
        url: `${SITE_URL}/listings/${l.id}`,
        lastModified: l.createdAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ]
  } catch {
    // DB 가 잠깐 안 되더라도 기본 주소는 내보낸다
    return base
  }
}
