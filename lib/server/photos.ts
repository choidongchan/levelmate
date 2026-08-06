import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ActionError } from './actions'

/**
 * 사진은 DB 가 아니라 서버 디스크에 둔다.
 * 백업(pg_dump)을 무겁게 만들지 않고, 배포 때 코드만 갈아끼워도 남아 있어야 하므로
 * 저장소 바깥 경로를 쓴다. 서버에서는 UPLOAD_DIR 로 지정한다.
 */
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), '.uploads')

const MAX_BYTES = 3 * 1024 * 1024

export const PHOTO_PREFIX = '/api/photos/'

const TYPES: Record<string, { ext: string; mime: string; looksRight: (b: Buffer) => boolean }> = {
  webp: {
    ext: 'webp',
    mime: 'image/webp',
    looksRight: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
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

const MIME_BY_EXT: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
}

/** data URL 을 받아 파일로 남기고, 화면이 쓸 주소를 돌려준다. */
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
  const name = `${createHash('sha256').update(buf).digest('hex').slice(0, 32)}.${kind.ext}`

  await mkdir(DIR, { recursive: true })
  await writeFile(path.join(DIR, name), buf)
  return PHOTO_PREFIX + name
}

export async function readPhoto(name: string) {
  if (!/^[a-f0-9]{32}\.(webp|jpg|png)$/.test(name)) return null
  try {
    const body = await readFile(path.join(DIR, name))
    return { body, mime: MIME_BY_EXT[name.split('.').pop() as string] }
  } catch {
    return null
  }
}
