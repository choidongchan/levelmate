import { EMPTY_STATE } from '@/lib/state'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/** 화면이 쓸 데이터 한 벌. 보는 사람에 따라 담기는 게 다르다. */
/** 사람마다 내용이 다르니 어디에도 저장되면 안 된다. */
const NO_STORE = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    return Response.json(await buildSnapshot(), { headers: NO_STORE })
  } catch (err) {
    console.error('[api/state]', err)
    return Response.json(EMPTY_STATE, { status: 503, headers: NO_STORE })
  }
}
