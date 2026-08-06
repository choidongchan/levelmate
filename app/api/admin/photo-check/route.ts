import { readViewer } from '@/lib/server/auth'
import { photoDiagnostics } from '@/lib/server/photos'

export const dynamic = 'force-dynamic'

/** 사진이 실제로 서버에 남아 있는지 확인한다. 관리자만 볼 수 있다. */
export async function GET() {
  const viewer = await readViewer()
  if (!viewer.isAdmin) {
    return Response.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  try {
    return Response.json(await photoDiagnostics(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (err) {
    console.error('[api/admin/photo-check]', err)
    return Response.json({ error: '확인하지 못했습니다' }, { status: 500 })
  }
}
