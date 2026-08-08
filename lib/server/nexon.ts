import { getSetting, NEXON_FC_KEY, NEXON_MAPLE_KEY, NEXON_SA_KEY } from './settings'

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

export type NexonGame = 'fconline' | 'maple' | 'sudden'

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000
const TIMEOUT_MS = 8000

export class NexonError extends Error {
  /** 넥슨이 실제로 뭐라고 답했는지. 관리자 화면에서만 보여준다. */
  detail?: string
  constructor(message: string, detail?: string) {
    super(message)
    this.detail = detail
  }
}

const SLOT: Record<NexonGame, { setting: string; env: string; label: string }> = {
  fconline: { setting: NEXON_FC_KEY, env: 'NEXON_FCONLINE_API_KEY', label: 'FC 온라인' },
  maple: { setting: NEXON_MAPLE_KEY, env: 'NEXON_MAPLE_API_KEY', label: '메이플' },
  sudden: { setting: NEXON_SA_KEY, env: 'NEXON_SUDDEN_API_KEY', label: '서든어택' },
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

  if (res.ok) return (await res.json()) as T

  // 넥슨은 실패를 대부분 400 으로 주고, 무엇이 틀렸는지는 본문의 이름표에 있다.
  const { name, message } = await errorBody(res)
  const detail = `HTTP ${res.status}${name ? ` ${name}` : ''}${message ? ` — ${message}` : ''}`
  const label = SLOT[game].label

  switch (name) {
    // 그런 계정이 없다. 잘못이 아니므로 조용히 빈손으로 돌아간다.
    case 'OPENAPI00003':
    case 'OPENAPI00004':
      return null
    case 'OPENAPI00002':
    case 'OPENAPI00005':
      console.error('[nexon] 키 문제', detail, path)
      throw new NexonError(`${label} 키가 잘못되었습니다. 관리자 화면에서 확인해주세요.`, detail)
    // 이 애플리케이션이 부를 수 없는 주소. 키가 아니라 이쪽 잘못이다.
    case 'OPENAPI00006':
      console.error('[nexon] 주소 문제', detail, path)
      throw new NexonError(`${label} 연동 주소가 맞지 않습니다. 관리자에게 알려주세요.`, detail)
    case 'OPENAPI00007':
      throw new NexonError('요청이 몰리고 있습니다. 잠시 뒤 다시 시도해주세요.', detail)
    case 'OPENAPI00009':
      throw new NexonError('넥슨이 아직 자료를 준비하고 있습니다. 잠시 뒤 다시 해주세요.', detail)
    case 'OPENAPI00010':
      throw new NexonError('넥슨이 점검 중입니다. 점검이 끝나면 다시 됩니다.', detail)
  }

  if (res.status === 401 || res.status === 403) {
    console.error('[nexon] 키 문제', detail, path)
    throw new NexonError(`${label} 키가 잘못되었습니다. 관리자 화면에서 확인해주세요.`, detail)
  }
  if (res.status === 404) return null
  console.error('[nexon]', detail, path)
  throw new NexonError('넥슨에서 정보를 가져오지 못했습니다.', detail)
}

async function errorBody(res: Response): Promise<{ name: string | null; message: string | null }> {
  try {
    const body = (await res.json()) as { error?: { name?: string; message?: string } }
    return { name: body?.error?.name ?? null, message: body?.error?.message ?? null }
  } catch {
    return { name: null, message: null }
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

async function divisionName(id: number): Promise<string> {
  if (!divisionNames) {
    // 이름표를 못 받아도 연결은 되어야 한다. 그때는 번호를 그대로 보여준다.
    const rows = await ask<{ divisionId: number; divisionName: string }[]>(
      'fconline',
      '/static/fconline/meta/division',
    ).catch((err) => {
      console.error('[nexon] 등급 이름표를 못 받았다', err)
      return null
    })
    if (rows) divisionNames = new Map(rows.map((r) => [r.divisionId, r.divisionName]))
  }
  return divisionNames?.get(id) ?? `디비전 ${id}`
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

// ─────────────────────────── 서든어택 ───────────────────────────

export async function lookupSudden(name: string) {
  const found = await ask<{ ouid?: string }>(
    'sudden',
    `/suddenattack/v1/id?user_name=${encodeURIComponent(name)}`,
  )
  return found?.ouid ? { id: found.ouid, name } : null
}

export async function suddenStats(ouid: string): Promise<GameStats> {
  const [basic, tier] = await Promise.all([
    ask<{ user_name?: string; user_level?: number; manner_grade?: string }>(
      'sudden',
      `/suddenattack/v1/user/basic?ouid=${ouid}`,
    ),
    // 계급이 없을 수도 있다. 없어도 나머지는 보여준다.
    ask<{ tier_name?: string; tier_grade?: string }>(
      'sudden',
      `/suddenattack/v1/user/tier?ouid=${ouid}`,
    ).catch(() => null),
  ])

  const level = basic?.user_level ?? 0
  const rank = tier?.tier_name ?? tier?.tier_grade ?? null

  return {
    tier: rank ?? (level ? `${level}레벨` : null),
    detail:
      [
        level && rank ? `${level}레벨` : null,
        basic?.manner_grade ? `매너 ${basic.manner_grade}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    stats: level ? { level } : null,
  }
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
  // 실제로 쓰는 주소로 확인한다. 없는 계정을 물어보면 "그런 계정 없음" 이 돌아오고,
  // 키나 권한이 잘못됐을 때만 다른 답이 온다.
  const probe = '%EB%A0%88%EB%B2%A8%EB%A9%94%EC%9D%B4%ED%8A%B8%ED%99%95%EC%9D%B8'
  const path =
    game === 'fconline'
      ? `/fconline/v1/id?nickname=${probe}`
      : game === 'sudden'
        ? `/suddenattack/v1/id?user_name=${probe}`
        : `/maplestory/v1/id?character_name=${probe}`
  try {
    await ask<unknown>(game, path)
    return { ok: true, message: '넥슨 서버와 정상적으로 통신했습니다.' }
  } catch (err) {
    if (err instanceof NexonError) {
      // 관리자만 보는 화면이다. 넥슨이 뭐라고 했는지 그대로 보여줘야 고칠 수 있다.
      return { ok: false, message: err.detail ? `${err.message} (${err.detail})` : err.message }
    }
    return { ok: false, message: '확인하지 못했습니다.' }
  }
}
