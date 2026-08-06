import { createHash } from 'node:crypto'
import { db } from '../db'
import { ActionError } from './actions'

/**
 * 올라온 사진은 DB 에 담는다.
 *
 * 처음에는 서버 디스크에 뒀는데, 그러면 저장 경로·권한·배포 방식 중 하나만
 * 어긋나도 파일이 조용히 사라진다. 게다가 올린 사람 브라우저에는 캐시가
 * 1년치 남아 있어서 본인 화면만 멀쩡해 보이고 다른 사람 화면에서만 안 보인다.
 * 알아채기 가장 어려운 종류의 고장이라 DB 로 옮겼다. 백업에도 같이 들어간다.
 *
 * 파일 시스템은 아예 건드리지 않는다. 경로를 조립해서 읽으면 번들러가
 * '어떤 파일이든 읽을 수 있다'고 보고 프로젝트 전체를 끌어안아, 작은 서버에서는
 * 빌드가 메모리 부족으로 죽는다.
 */
const MAX_BYTES = 3 * 1024 * 1024

export const PHOTO_PREFIX = '/api/photos/'

const TYPES: Record<string, { ext: string; mime: string; looksRight: (b: Buffer) => boolean }> = {
  webp: {
    ext: 'webp',
    mime: 'image/webp',
    looksRight: (b) =>
      b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
  },
  jpeg: {
    ext: 'jpg',
    mime: 'image/jpeg',
    looksRight: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  png: {
    ext: 'png',
    mime: 'image/png',
    looksRight: (b) => b[0] === 0x89 && b.subarray(1, 4).toString() === 'PNG',
  },
}

const NAME_RE = /^[a-f0-9]{32}\.(webp|jpg|png)$/

/** data URL 을 받아 담고, 화면이 쓸 주소를 돌려준다. */
export async function savePhoto(dataUrl: unknown): Promise<string> {
  if (typeof dataUrl !== 'string') throw new ActionError('사진이 없습니다')
  const match = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new ActionError('사진 형식이 올바르지 않습니다')

  const kind = TYPES[match[1]]
  const buf = Buffer.from(match[2], 'base64')
  if (buf.byteLength === 0) throw new ActionError('사진이 비어 있습니다')
  if (buf.byteLength > MAX_BYTES) throw new ActionError('사진이 너무 큽니다 (3MB 이하)')
  // 확장자만 믿지 않고 실제 내용도 확인한다
  if (!kind.looksRight(buf)) throw new ActionError('사진 파일이 아닙니다')

  // 같은 사진은 같은 이름이 된다. 주소가 안 바뀌니 캐시를 오래 둘 수 있다.
  const id = `${createHash('sha256').update(buf).digest('hex').slice(0, 32)}.${kind.ext}`

  await db.photo.upsert({
    where: { id },
    update: {},
    create: { id, mime: kind.mime, data: buf, bytes: buf.byteLength },
  })

  return PHOTO_PREFIX + id
}

export async function readPhoto(name: string) {
  if (!NAME_RE.test(name)) return null
  const row = await db.photo.findUnique({ where: { id: name } })
  if (!row) return null
  return { body: Buffer.from(row.data), mime: row.mime }
}

/**
 * 사진이 지금 어떤 상태인지 그대로 알려준다.
 * "올렸는데 다른 사람 화면에서 안 보인다" 같은 상황을 눈으로 확인하기 위한 것이다.
 */
export async function photoDiagnostics() {
  const users = await db.user.findMany({
    where: { photoUrl: { not: null } },
    select: { nickname: true, photoUrl: true },
  })
  const stored = new Set((await db.photo.findMany({ select: { id: true } })).map((p) => p.id))

  const broken: { nickname: string; reason: string }[] = []
  let uploaded = 0
  let staticPath = 0

  for (const u of users) {
    const url = u.photoUrl as string

    if (url.startsWith(PHOTO_PREFIX)) {
      uploaded += 1
      if (!stored.has(url.slice(PHOTO_PREFIX.length))) {
        broken.push({ nickname: u.nickname, reason: '사진이 서버에 없습니다. 다시 올려주세요' })
      }
    } else if (url.startsWith('data:')) {
      broken.push({ nickname: u.nickname, reason: '옛 방식으로 담긴 사진입니다. 다시 올려주세요' })
    } else {
      staticPath += 1
      if (!url.startsWith('/')) {
        broken.push({ nickname: u.nickname, reason: '주소 형식이 이상합니다' })
      }
    }
  }

  return { total: users.length, uploaded, staticPath, stored: stored.size, broken }
}
