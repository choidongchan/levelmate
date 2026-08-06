import { cookies } from 'next/headers'
import { adminSignIn } from '@/lib/server/actions'
import { ADMIN_COOKIE, adminExpiry, sweepSessions } from '@/lib/server/auth'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  try {
    const token = await adminSignIn(String(body.username ?? ''), String(body.password ?? ''))
    if (!token) {
      // 아이디가 틀렸는지 비밀번호가 틀렸는지는 알려주지 않는다
      return Response.json({ error: '아이디 또는 비밀번호가 맞지 않습니다' }, { status: 401 })
    }
    void sweepSessions()

    const jar = await cookies()
    jar.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: adminExpiry(),
    })

    return Response.json({ state: await buildSnapshot() })
  } catch (err) {
    console.error('[api/admin/login]', err)
    return Response.json({ error: '로그인하지 못했습니다' }, { status: 500 })
  }
}
