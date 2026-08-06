import { db } from '@/lib/db'
import { ActionError } from '@/lib/server/actions'
import { readViewer } from '@/lib/server/auth'
import { savePhoto } from '@/lib/server/photos'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/**
 * 프로필 사진 올리기.
 *
 * 화면에서 이미 3:4 로 잘라 WebP 로 줄인 뒤 data URL 로 보내온다.
 * 여기서는 파일로 남기고 회원 정보의 사진 주소만 바꾼다.
 *
 * 관리자가 올리면 바로 노출하고, 본인이 올리면 검수 대기로 둔다.
 */
export async function POST(req: Request) {
  let body: { userId?: unknown; dataUrl?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  const viewer = await readViewer()
  const userId = String(body.userId ?? '')

  if (!viewer.isAdmin && viewer.userId !== userId) {
    return Response.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  try {
    const url = await savePhoto(body.dataUrl)
    await db.user.update({
      where: { id: userId },
      data: { photoUrl: url, photoStatus: viewer.isAdmin ? 'APPROVED' : 'PENDING' },
    })
    return Response.json({ url, state: await buildSnapshot() })
  } catch (err) {
    if (err instanceof ActionError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('[api/photos]', err)
    return Response.json({ error: '사진을 저장하지 못했습니다' }, { status: 500 })
  }
}
