import { db } from '../db'

/**
 * 운영자가 관리자 화면에서 넣는 설정값.
 *
 * 서버에 들어가 .env 를 고치지 않아도 되게 DB 에 둔다.
 * 요청마다 DB 를 두드리면 낭비라 잠깐 담아둔다.
 */
const TTL_MS = 30_000
const cache = new Map<string, { value: string | null; at: number }>()

export const RIOT_KEY = 'riot_api_key'
export const PUBG_KEY = 'pubg_api_key'
/** 마지막 호출이 성공했는지. 키가 만료되면 여기가 먼저 0 이 된다. */
export const RIOT_KEY_OK = 'riot_api_key_ok'
export const RIOT_KEY_CHECKED = 'riot_api_key_checked_at'

/** 키 상태를 적어둔다. 실패를 눈에 띄게 하려는 것이므로 실패해도 조용히 넘어간다. */
export function markRiotKey(ok: boolean) {
  void setSetting(RIOT_KEY_OK, ok ? '1' : '0').catch(() => {})
  void setSetting(RIOT_KEY_CHECKED, new Date().toISOString()).catch(() => {})
}

export async function getSetting(key: string): Promise<string | null> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const row = await db.setting.findUnique({ where: { key } }).catch(() => null)
  const value = row?.value?.trim() || null
  cache.set(key, { value, at: Date.now() })
  return value
}

export async function setSetting(key: string, value: string | null) {
  const clean = value?.trim() || null
  if (clean) {
    await db.setting.upsert({
      where: { key },
      create: { key, value: clean },
      update: { value: clean },
    })
  } else {
    await db.setting.deleteMany({ where: { key } })
  }
  cache.delete(key)
}

/** 비밀값은 원문을 내보내지 않는다. 설정됐는지와 끝 네 글자만 보여준다. */
export function maskSecret(value: string | null) {
  if (!value) return null
  return `••••${value.slice(-4)}`
}
