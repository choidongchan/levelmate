import { readViewer } from '@/lib/server/auth'
import { checkKey, keyStatus } from '@/lib/server/riot'
import { maskSecret, RIOT_KEY, setSetting } from '@/lib/server/settings'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/**
 * 운영 설정.
 *
 * 비밀값은 원문을 절대 내보내지 않는다. 설정됐는지와 끝 네 글자만 알려준다.
 * .env 로 넣은 값이 있으면 그쪽이 우선이고, 화면에서는 바꿀 수 없다고 알린다.
 */
async function state() {
  const riot = await keyStatus()
  return {
    riot: {
      set: riot.set,
      source: riot.source,
      masked: maskSecret(riot.value),
    },
  }
}

export async function GET() {
  const viewer = await readViewer()
  if (!viewer.isAdmin) return Response.json({ error: '권한이 없습니다' }, { status: 403 })
  try {
    return Response.json(await state(), { headers: NO_STORE })
  } catch (err) {
    console.error('[api/admin/settings]', err)
    return Response.json({ error: '불러오지 못했습니다' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const viewer = await readViewer()
  if (!viewer.isAdmin) return Response.json({ error: '권한이 없습니다' }, { status: 403 })

  let body: { op?: unknown; value?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  try {
    switch (String(body.op ?? '')) {
      case 'saveRiotKey': {
        const value = String(body.value ?? '').trim()
        if (value && !/^RGAPI-[A-Za-z0-9-]{8,60}$/.test(value)) {
          return Response.json(
            { error: '키 형태가 아닙니다. RGAPI- 로 시작하는 값을 넣어주세요.' },
            { status: 400 },
          )
        }
        await setSetting(RIOT_KEY, value || null)
        const test = value ? await checkKey() : { ok: false, message: '키를 지웠습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
      }
      case 'testRiotKey':
        return Response.json({ ...(await state()), test: await checkKey() }, { headers: NO_STORE })
      default:
        return Response.json({ error: '알 수 없는 요청입니다' }, { status: 400 })
    }
  } catch (err) {
    console.error('[api/admin/settings]', body.op, err)
    return Response.json({ error: '처리하지 못했습니다' }, { status: 500 })
  }
}
