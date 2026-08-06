import { readPhoto } from '@/lib/server/photos'

/**
 * 올라온 사진 내보내기.
 * 파일 이름이 곧 내용의 지문이라 내용이 바뀌면 주소도 바뀐다.
 * 그래서 캐시를 아주 길게 잡아도 안전하다.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const photo = await readPhoto(file)
  if (!photo) return new Response('찾을 수 없습니다', { status: 404 })

  return new Response(new Uint8Array(photo.body), {
    headers: {
      'Content-Type': photo.mime,
      'Content-Length': String(photo.body.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
