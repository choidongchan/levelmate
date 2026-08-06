import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { USER_COOKIE } from '@/lib/server/auth'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

export async function POST() {
  const jar = await cookies()
  const token = jar.get(USER_COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { token } }).catch(() => {})
  jar.delete(USER_COOKIE)
  return Response.json({ state: await buildSnapshot() })
}
