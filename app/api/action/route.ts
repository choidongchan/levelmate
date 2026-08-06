import { ActionError, runAction } from '@/lib/server/actions'
import { readViewer } from '@/lib/server/auth'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/**
 * 화면에서 일어나는 모든 변경이 여기로 들어온다.
 * 무엇을 할 수 있는지는 runAction 안에서 보는 사람 기준으로 따진다.
 * 끝나면 바뀐 데이터 한 벌을 그대로 돌려주어 화면이 어긋나지 않게 한다.
 */
export async function POST(req: Request) {
  let body: { type?: unknown; payload?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  const viewer = await readViewer()

  try {
    await runAction(String(body.type ?? ''), (body.payload ?? {}) as Record<string, unknown>, viewer)
  } catch (err) {
    if (err instanceof ActionError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('[api/action]', body.type, err)
    return Response.json({ error: '처리하지 못했습니다' }, { status: 500 })
  }

  return Response.json({ state: await buildSnapshot() })
}
