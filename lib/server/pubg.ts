import { getSetting, PUBG_KEY } from './settings'

/**
 * 배틀그라운드 공식 API.
 *
 * 호출 한도가 분당 10번뿐이다. 그래서 한 사람당 갱신은 SYNC_COOLDOWN 마다
 * 한 번만 하고, 결과는 DB 에 담아둔다. 화면은 DB 만 본다.
 * 한 번 갱신할 때 세 번 부른다 (시즌 → 계정 → 전적).
 */

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000
const TIMEOUT_MS = 8000

export class PubgError extends Error {}

/** 계정이 어느 쪽에 있는지. 한국은 카카오가 많다. */
export const PUBG_PLATFORMS: { key: string; label: string }[] = [
  { key: 'kakao', label: '카카오' },
  { key: 'steam', label: '스팀' },
]

export const DEFAULT_PUBG_PLATFORM = 'kakao'

const TIER_KO: Record<string, string> = {
  Bronze: '브론즈',
  Silver: '실버',
  Gold: '골드',
  Platinum: '플래티넘',
  Diamond: '다이아몬드',
  Master: '마스터',
  Survivor: '서바이버',
}

async function apiKey(): Promise<string> {
  const key = process.env.PUBG_API_KEY?.trim() || (await getSetting(PUBG_KEY))
  if (!key) {
    throw new PubgError('배그 연동이 아직 준비되지 않았습니다. 관리자에게 알려주세요.')
  }
  return key
}

function endpoint(path: string) {
  return `${process.env.PUBG_API_BASE || 'https://api.pubg.com'}${path}`
}

async function ask<T>(path: string): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(endpoint(path), {
      headers: {
        Authorization: `Bearer ${await apiKey()}`,
        Accept: 'application/vnd.api+json',
      },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof PubgError) throw err
    throw new PubgError('배그 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    console.error('[pubg] 키 문제', res.status, path)
    throw new PubgError('배그 키가 잘못되었습니다. 관리자 화면에서 확인해주세요.')
  }
  if (res.status === 429) {
    throw new PubgError('요청이 몰리고 있습니다. 1분 뒤에 다시 시도해주세요.')
  }
  if (!res.ok) {
    console.error('[pubg]', res.status, path)
    throw new PubgError('배그에서 정보를 가져오지 못했습니다.')
  }
  return (await res.json()) as T
}

// ─────────────────────────── 조회 ───────────────────────────

type Listed<T> = { data?: T[] }

/** 지금 진행 중인 시즌 */
async function currentSeason(platform: string): Promise<string | null> {
  const seasons = await ask<Listed<{ id: string; attributes?: { isCurrentSeason?: boolean } }>>(
    `/shards/${platform}/seasons`,
  )
  const now = seasons?.data?.find((s) => s.attributes?.isCurrentSeason)
  return now?.id ?? seasons?.data?.[seasons.data.length - 1]?.id ?? null
}

export async function lookupPlayer(name: string, platform: string) {
  const found = await ask<Listed<{ id: string; attributes?: { name?: string } }>>(
    `/shards/${platform}/players?filter[playerNames]=${encodeURIComponent(name)}`,
  )
  const p = found?.data?.[0]
  return p ? { id: p.id, name: p.attributes?.name ?? name } : null
}

type ModeStats = {
  currentTier?: { tier?: string; subTier?: string }
  currentRankPoint?: number
  roundsPlayed?: number
  wins?: number
  kda?: number
  damageDealt?: number
  winRatio?: number
}

export type PubgStats = {
  tier: string | null
  detail: string | null
  stats: {
    mode: string
    rp: number
    rounds: number
    wins: number
    kda: number
    avgDamage: number
    winRate: number
  } | null
}

const MODE_KO: Record<string, string> = {
  solo: '솔로',
  'solo-fpp': '솔로 1인칭',
  duo: '듀오',
  'duo-fpp': '듀오 1인칭',
  squad: '스쿼드',
  'squad-fpp': '스쿼드 1인칭',
}

/** 랭크 전적. 가장 많이 한 모드를 대표로 삼는다. */
export async function getRankedStats(
  accountId: string,
  platform: string,
): Promise<PubgStats> {
  const season = await currentSeason(platform)
  if (!season) return { tier: null, detail: null, stats: null }

  const res = await ask<{
    data?: { attributes?: { rankedGameModeStats?: Record<string, ModeStats> } }
  }>(`/shards/${platform}/players/${accountId}/seasons/${season}/ranked`)

  const modes = res?.data?.attributes?.rankedGameModeStats ?? {}
  const entries = Object.entries(modes).filter(([, m]) => (m.roundsPlayed ?? 0) > 0)
  if (entries.length === 0) return { tier: null, detail: null, stats: null }

  const [mode, m] = entries.sort(
    (a, b) => (b[1].roundsPlayed ?? 0) - (a[1].roundsPlayed ?? 0),
  )[0]

  const rounds = m.roundsPlayed ?? 0
  const tierName = m.currentTier?.tier ? (TIER_KO[m.currentTier.tier] ?? m.currentTier.tier) : null
  const tier = tierName ? `${tierName}${m.currentTier?.subTier ? ` ${m.currentTier.subTier}` : ''}` : null

  const avgDamage = rounds ? Math.round((m.damageDealt ?? 0) / rounds) : 0
  const winRate = Math.round((m.winRatio ?? 0) * 100)

  return {
    tier,
    detail: `${MODE_KO[mode] ?? mode} · ${m.currentRankPoint ?? 0} RP · ${rounds}판`,
    stats: {
      mode,
      rp: m.currentRankPoint ?? 0,
      rounds,
      wins: m.wins ?? 0,
      kda: Math.round((m.kda ?? 0) * 100) / 100,
      avgDamage,
      winRate,
    },
  }
}

export async function pubgKeyStatus() {
  const fromEnv = process.env.PUBG_API_KEY?.trim()
  if (fromEnv) return { set: true, source: 'env' as const, value: fromEnv }
  const fromDb = await getSetting(PUBG_KEY)
  if (fromDb) return { set: true, source: 'db' as const, value: fromDb }
  return { set: false, source: null, value: null }
}

/** 키가 실제로 먹히는지 가볍게 확인한다 */
export async function checkPubgKey(): Promise<{ ok: boolean; message: string }> {
  try {
    await ask<unknown>(`/shards/${DEFAULT_PUBG_PLATFORM}/seasons`)
    return { ok: true, message: '배그 서버와 정상적으로 통신했습니다.' }
  } catch (err) {
    return { ok: false, message: err instanceof PubgError ? err.message : '확인하지 못했습니다.' }
  }
}
