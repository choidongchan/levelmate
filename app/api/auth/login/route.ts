import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { newToken, sweepSessions, USER_COOKIE, userExpiry } from '@/lib/server/auth'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/**
 * 휴대폰 번호로 로그인. 처음이면 회원을 만든다.
 *
 * 아직 실제 본인확인(PASS·NICE)을 붙이기 전이다. 인증번호는 화면에서
 * 흉내만 내고 있고, 여기서는 번호만 보고 통과시킨다.
 * 본인확인을 붙이면 이 자리에서 인증 결과를 확인하면 된다.
 */
export async function POST(req: Request) {
  let body: { phone?: unknown; nickname?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  const digits = String(body.phone ?? '').replace(/[^0-9]/g, '')
  if (digits.length < 10 || !digits.startsWith('01')) {
    return Response.json({ error: '휴대폰 번호를 확인해주세요' }, { status: 400 })
  }
  const pretty = digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')
  const nickname = String(body.nickname ?? '').trim().slice(0, 12)

  try {
    let user = await db.user.findUnique({ where: { phoneDigits: digits } })

    if (user?.bannedAt) {
      return Response.json({ error: '이용이 정지된 계정입니다' }, { status: 403 })
    }

    if (!user) {
      user = await db.user.create({
        data: {
          id: `u-${digits.slice(-4)}${Date.now().toString(36)}`,
          nickname: nickname || `게이머${digits.slice(-4)}`,
          phone: pretty,
          phoneDigits: digits,
          hue: hueFromDigits(digits),
          verified: true, // 인증번호 확인을 마친 것으로 본다
        },
      })
    } else if (nickname && user.nickname !== nickname) {
      user = await db.user.update({ where: { id: user.id }, data: { nickname } })
    }

    const token = newToken()
    await db.session.create({ data: { token, userId: user.id, expiresAt: userExpiry() } })
    void sweepSessions()

    const jar = await cookies()
    jar.set(USER_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: userExpiry(),
    })

    return Response.json({ state: await buildSnapshot() })
  } catch (err) {
    console.error('[api/auth/login]', err)
    return Response.json({ error: '로그인하지 못했습니다' }, { status: 500 })
  }
}

function hueFromDigits(digits: string) {
  let h = 0
  for (const ch of digits) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}
