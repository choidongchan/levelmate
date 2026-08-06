import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ADMIN_COOKIE } from '@/lib/server/auth'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

export async function POST() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE)?.value
  if (token) await db.adminSession.deleteMany({ where: { token } }).catch(() => {})
  jar.delete(ADMIN_COOKIE)
  return Response.json({ state: await buildSnapshot() })
}
