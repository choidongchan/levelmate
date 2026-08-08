import { getSetting, NEXON_FC_KEY, NEXON_MAPLE_KEY } from './settings'

/**
 * 넥슨 오픈 API.
 *
 * FC 온라인과 메이플스토리를 본다. 넥슨은 애플리케이션을 게임마다 따로
 * 등록하게 되어 있어서 키도 게임마다 다르다. 그래서 부를 때마다 어느
 * 게임인지 같이 넘긴다.
 *
 * 라이엇과 달리 키가 만료되지 않아 한 번 넣으면 계속 쓴다.
 *
 * 두 게임 모두 "닉네임 → 고유 번호 → 정보" 순서로 두세 번 부른다.
 * 결과는 DB 에 담아두고 화면은 DB 만 본다.
 */

export type NexonGame = 'fconline' | 'maple'

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000
const TIMEOUT_MS = 8000

export class NexonError extends Error {}

const SLOT: Record<NexonGame, { setting: string; env: string; label: string }> = {
  fconline: { setting: NEXON_FC_KEY, env: 'NEXON_FCONLINE_API_KEY', label: 'FC 온라인' },
  maple: { setting: NEXON_MAPLE_KEY, env: 'NEXON_MAPLE_API_KEY', label: '메이플' },
}

async function apiKey(game: NexonGame): Promise<string> {
  const slot = SLOT[game]
  const key = process.env[slot.env]?.trim() || (await getSetting(slot.setting))
  if (!key) {
    throw new NexonError(`${slot.label} 연동이 아직 준비되지 않았습니다. 관리자에게 알려주세요.`)
  }
  return key
}

function endpoint(path: string) {
  return `${process.env.NEXON_API_BASE || 'https://open.api.nexon.com'}${path}`
}

async function ask<T>(game: NexonGame, path: string): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(endpoint(path), {
      headers: { 'x-nxopen-api-key': await apiKey(game) },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof NexonError) throw err
    throw new NexonError('넥슨 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.')
  } finally {
    clearTimeout(timer)
  }

  // 넥슨은 "그런 캐릭터 없음"도 400 으로 준다. 본문의 이름표로 갈라낸다.
  if (res.status === 400 || res.status === 404) {
    const name = await errorName(res)
    if (name === 'OPENAPI00004' || res.status === 404) return null
    if (name === 'OPENAPI00007') {
      throw new NexonError('요청이 몰리고 있습니다. 잠시 뒤 다시 시도해주세요.')
    }
    return null
  }
  if (res.status === 401 || res.status === 403) {
    console.error('[nexon] 키 문제', res.status, path)
    throw new NexonError(
      `${SLOT[game].label} 키가 잘못되었습니다. 관리자 화면에서 확인해주세요.`,
    )
  }
  if (res.status === 429) {
    throw new NexonError('요청이 몰리고 있습니다. 잠시 뒤 다시 시도해주세요.')
  }
  if (!res.ok) {
    console.error('[nexon]', res.status, path)
    throw new NexonError('넥슨에서 정보를 가져오지 못했습니다.')
  }
  return (await res.json()) as T
}

async function errorName(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: { name?: string } }
    return body?.error?.name ?? null
  } catch {
    return null
  }
}

export type GameStats = {
  tier: string | null
  detail: string | null
  stats: Record<string, number | string> | null
}

// ─────────────────────────── FC 온라인 ───────────────────────────

/** 공식경기. 감독모드(52)와 볼타는 따로라 대표로 삼지 않는다. */
const OFFICIAL_MATCH = 50

export async function lookupFconline(nickname: string) {
  const found = await ask<{ ouid?: string }>(
    'fconline',
    `/fconline/v1/id?nickname=${encodeURIComponent(nickname)}`,
  )
  return found?.ouid ? { id: found.ouid, name: nickname } : null
}

/**
 * 등급 이름은 넥슨이 번호로 주고, 번호↔이름 표를 따로 준다.
 * 표는 잘 안 바뀌므로 한 번 받아 담아둔다.
 */
let divisionNames: Map<number, string> | null = null

async function divisionName(id: number): Promise<string | null> {
  if (!divisionNames) {
    const rows = await ask<{ divisionId: number; divisionName: string }[]>(
      'fconline',
      '/static/fconline/meta/division',
    )
    if (!rows) return null
    divisionNames = new Map(rows.map((r) => [r.divisionId, r.divisionName]))
  }
  return divisionNames.get(id) ?? null
}

export async function fconlineStats(ouid: string): Promise<GameStats> {
  const [basic, divisions] = await Promise.all([
    ask<{ nickname?: string; level?: number }>('fconline', `/fconline/v1/user/basic?ouid=${ouid}`),
    ask<{ matchType: number; division: number; achievementDate?: string }[]>(
      'fconline',
      `/fconline/v1/user/maxdivision?ouid=${ouid}`,
    ),
  ])

  const official = divisions?.find((d) => d.matchType === OFFICIAL_MATCH) ?? divisions?.[0] ?? null
  const tier = official ? await divisionName(official.division) : null
  const level = basic?.level ?? 0

  return {
    tier,
    detail: [tier ? '공식경기 최고등급' : null, level ? `Lv.${level}` : null]
      .filter(Boolean)
      .join(' · ') || null,
    stats: official ? { level, division: official.division } : level ? { level } : null,
  }
}

// ─────────────────────────── 메이플스토리 ───────────────────────────

export async function lookupMaple(name: string) {
  const found = await ask<{ ocid?: string }>(
    'maple',
    `/maplestory/v1/id?character_name=${encodeURIComponent(name)}`,
  )
  return found?.ocid ? { id: found.ocid, name } : null
}

export async function mapleStats(ocid: string): Promise<GameStats> {
  const [basic, stat] = await Promise.all([
    ask<{
      character_name?: string
      world_name?: string
      character_class?: string
      character_level?: number
      character_guild_name?: string | null
    }>('maple', `/maplestory/v1/character/basic?ocid=${ocid}`),
    ask<{ final_stat?: { stat_name: string; stat_value: string }[] }>(
      'maple',
      `/maplestory/v1/character/stat?ocid=${ocid}`,
    ),
  ])

  const level = basic?.character_level ?? 0
  const job = basic?.character_class ?? null
  const power = Number(
    stat?.final_stat?.find((s) => s.stat_name === '전투력')?.stat_value ?? 0,
  )

  return {
    // 메이플은 티어가 없다. 레벨과 직업이 그 자리를 대신한다.
    tier: level ? `Lv.${level}${job ? ` ${job}` : ''}` : null,
    detail:
      [basic?.world_name, basic?.character_guild_name || null, power ? `전투력 ${han(power)}` : null]
        .filter(Boolean)
        .join(' · ') || null,
    stats: level ? { level, power, world: basic?.world_name ?? '', job: job ?? '' } : null,
  }
}

/** 전투력은 자리수가 커서 그대로 쓰면 안 읽힌다 */
function han(n: number) {
  if (n >= 100_000_000) return `${Math.round(n / 10_000_000) / 10}억`
  if (n >= 10_000) return `${Math.round(n / 1_000) / 10}만`
  return String(n)
}

export async function nexonKeyStatus(game: NexonGame) {
  const slot = SLOT[game]
  const fromEnv = process.env[slot.env]?.trim()
  if (fromEnv) return { set: true, source: 'env' as const, value: fromEnv }
  const fromDb = await getSetting(slot.setting)
  if (fromDb) return { set: true, source: 'db' as const, value: fromDb }
  return { set: false, source: null, value: null }
}

/**
 * 키가 실제로 먹히는지 가볍게 확인한다.
 * 게임마다 키가 다르므로 그 게임의 값싼 주소를 하나씩 부른다.
 */
export async function checkNexonKey(game: NexonGame): Promise<{ ok: boolean; message: string }> {
  try {
    if (game === 'fconline') await ask<unknown>('fconline', '/static/fconline/meta/division')
    // 메이플은 값싼 표가 따로 없다. 없는 캐릭터를 물어보면 키가 틀렸을 때만 다르게 답한다.
    else await ask<unknown>('maple', '/maplestory/v1/id?character_name=%EB%A0%88%EB%B2%A8%EB%A9%94%EC%9D%B4%ED%8A%B8%ED%99%95%EC%9D%B8')
    return { ok: true, message: '넥슨 서버와 정상적으로 통신했습니다.' }
  } catch (err) {
    return { ok: false, message: err instanceof NexonError ? err.message : '확인하지 못했습니다.' }
  }
}
