import { toRole, type LolRole } from '../riot'

/**
 * 라이엇 게임즈 API.
 *
 * 우리가 화면에 쓰는 티어·승률·선호 챔피언은 전부 여기서 온다.
 * 남의 사이트 화면을 긁지 않는다. 약관 위반이고 언제든 막힌다.
 *
 * 호출 한도가 빡빡하다(개발 키 기준 2분에 100번). 그래서
 *  - 한 사람당 갱신은 SYNC_COOLDOWN 마다 한 번만
 *  - 최근 경기는 MATCH_COUNT 판만 본다 (경기 하나당 호출 한 번)
 * 결과는 DB 에 담아두고 화면은 그걸 본다.
 */

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000
const MATCH_COUNT = 10
const TIMEOUT_MS = 8000

/** 화면에 그대로 보여줄 수 있는 오류 */
export class RiotError extends Error {}

/** 지역 코드 → 두 종류의 주소. 라이엇은 요청마다 갈리는 곳이 다르다. */
const PLATFORMS: Record<string, { platform: string; regional: string; label: string }> = {
  kr: { platform: 'kr', regional: 'asia', label: '한국' },
  jp1: { platform: 'jp1', regional: 'asia', label: '일본' },
  na1: { platform: 'na1', regional: 'americas', label: '북미' },
  euw1: { platform: 'euw1', regional: 'europe', label: '서유럽' },
}

export const DEFAULT_PLATFORM = 'kr'

function routes(platform: string) {
  return PLATFORMS[platform] ?? PLATFORMS[DEFAULT_PLATFORM]
}

function apiKey() {
  const key = process.env.RIOT_API_KEY
  if (!key) {
    throw new RiotError('라이엇 연동이 아직 준비되지 않았습니다. 잠시 뒤 다시 시도해주세요.')
  }
  return key
}

/**
 * 시험용으로 다른 주소를 볼 수 있게 열어둔다.
 * 라이엇 서버에 닿지 않는 곳에서 흐름을 확인할 때만 쓴다. 평소에는 비워둔다.
 */
function endpoint(host: string, path: string) {
  const base = process.env.RIOT_API_BASE
  return base ? `${base}/${host}${path}` : `https://${host}.api.riotgames.com${path}`
}

/** 라이엇에 한 번 물어본다. 실패는 사람이 읽을 수 있는 말로 바꾼다. */
async function ask<T>(host: string, path: string): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(endpoint(host, path), {
      headers: { 'X-Riot-Token': apiKey() },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof RiotError) throw err
    throw new RiotError('라이엇 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    console.error('[riot] 키가 만료되었거나 권한이 없습니다', res.status, path)
    throw new RiotError('라이엇 연동이 잠시 멈춰 있습니다. 운영자에게 알려주세요.')
  }
  if (res.status === 429) {
    throw new RiotError('요청이 몰리고 있습니다. 1분 뒤에 다시 시도해주세요.')
  }
  if (!res.ok) {
    console.error('[riot]', res.status, path)
    throw new RiotError('라이엇에서 정보를 가져오지 못했습니다.')
  }

  return (await res.json()) as T
}

// ─────────────────────────── 계정 ───────────────────────────

export type RiotAccountInfo = { puuid: string; gameName: string; tagLine: string }

/** "이름#태그" 로 계정을 찾는다 */
export async function lookupRiotId(
  gameName: string,
  tagLine: string,
  platform = DEFAULT_PLATFORM,
): Promise<RiotAccountInfo | null> {
  const { regional } = routes(platform)
  return ask<RiotAccountInfo>(
    regional,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  )
}

type SummonerDTO = { id?: string; profileIconId?: number; summonerLevel?: number }

export async function getSummoner(puuid: string, platform = DEFAULT_PLATFORM) {
  const { platform: host } = routes(platform)
  return ask<SummonerDTO>(host, `/lol/summoner/v4/summoners/by-puuid/${puuid}`)
}

// ─────────────────────────── 랭크 ───────────────────────────

type LeagueEntry = {
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

export type RankInfo = {
  tier: string | null
  division: string | null
  lp: number
  wins: number
  losses: number
}

const EMPTY_RANK: RankInfo = { tier: null, division: null, lp: 0, wins: 0, losses: 0 }

/** 솔로랭크 기준. 언랭이면 빈 값을 준다. */
export async function getSoloRank(
  puuid: string,
  summonerId: string | null,
  platform = DEFAULT_PLATFORM,
): Promise<RankInfo> {
  const { platform: host } = routes(platform)

  // 라이엇이 puuid 기준으로 옮겨가는 중이라 둘 다 받아준다
  let entries = await ask<LeagueEntry[]>(host, `/lol/league/v4/entries/by-puuid/${puuid}`).catch(
    () => null,
  )
  if (!entries && summonerId) {
    entries = await ask<LeagueEntry[]>(
      host,
      `/lol/league/v4/entries/by-summoner/${summonerId}`,
    ).catch(() => null)
  }
  if (!entries?.length) return EMPTY_RANK

  const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5') ?? entries[0]
  return {
    tier: solo.tier ?? null,
    division: solo.rank ?? null,
    lp: solo.leaguePoints ?? 0,
    wins: solo.wins ?? 0,
    losses: solo.losses ?? 0,
  }
}

// ─────────────────────────── 최근 경기 ───────────────────────────

type MatchDTO = {
  info?: {
    participants?: {
      puuid: string
      championId: number
      championName: string
      teamPosition?: string
      win: boolean
      kills: number
      deaths: number
      assists: number
    }[]
  }
}

export type RecentStats = {
  mainRole: LolRole | null
  champions: { id: number; name: string; games: number; wins: number }[]
  kills: number
  deaths: number
  assists: number
  recentGames: number
}

const EMPTY_RECENT: RecentStats = {
  mainRole: null,
  champions: [],
  kills: 0,
  deaths: 0,
  assists: 0,
  recentGames: 0,
}

/** 최근 몇 판에서 주 포지션·많이 한 챔피언·평균 KDA 를 뽑는다 */
export async function getRecentStats(
  puuid: string,
  platform = DEFAULT_PLATFORM,
): Promise<RecentStats> {
  const { regional } = routes(platform)

  const ids = await ask<string[]>(
    regional,
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${MATCH_COUNT}`,
  )
  if (!ids?.length) return EMPTY_RECENT

  // 한 판씩 물어본다. 한도가 있어 한 번에 몰아치지 않고 조금씩 나눠 부른다.
  const matches: MatchDTO[] = []
  for (let i = 0; i < ids.length; i += 4) {
    const chunk = await Promise.all(
      ids.slice(i, i + 4).map((id) =>
        ask<MatchDTO>(regional, `/lol/match/v5/matches/${id}`).catch(() => null),
      ),
    )
    for (const m of chunk) if (m) matches.push(m)
  }
  if (!matches.length) return EMPTY_RECENT

  const roleCount = new Map<LolRole, number>()
  const champ = new Map<number, { id: number; name: string; games: number; wins: number }>()
  let kills = 0
  let deaths = 0
  let assists = 0
  let games = 0

  for (const m of matches) {
    const me = m.info?.participants?.find((p) => p.puuid === puuid)
    if (!me) continue
    games += 1
    kills += me.kills ?? 0
    deaths += me.deaths ?? 0
    assists += me.assists ?? 0

    const role = toRole(me.teamPosition)
    if (role) roleCount.set(role, (roleCount.get(role) ?? 0) + 1)

    const cur = champ.get(me.championId) ?? {
      id: me.championId,
      name: me.championName,
      games: 0,
      wins: 0,
    }
    cur.games += 1
    if (me.win) cur.wins += 1
    champ.set(me.championId, cur)
  }

  if (games === 0) return EMPTY_RECENT

  const mainRole =
    [...roleCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    mainRole,
    champions: [...champ.values()].sort((a, b) => b.games - a.games).slice(0, 3),
    kills: Math.round((kills / games) * 10) / 10,
    deaths: Math.round((deaths / games) * 10) / 10,
    assists: Math.round((assists / games) * 10) / 10,
    recentGames: games,
  }
}

// ─────────────────────────── 본인 확인 ───────────────────────────

/**
 * 게임 클라이언트 설정에 넣은 코드를 확인한다.
 * 이걸 통과해야 그 계정이 본인 것이라고 말할 수 있다.
 */
export async function getThirdPartyCode(
  summonerId: string,
  platform = DEFAULT_PLATFORM,
): Promise<string | null> {
  const { platform: host } = routes(platform)
  const code = await ask<string>(
    host,
    `/lol/platform/v4/third-party-code/by-summoner/${summonerId}`,
  ).catch(() => null)
  return typeof code === 'string' ? code.trim() : null
}

/** 사람이 옮겨 적기 쉬운 짧은 코드 */
export function newVerifyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'HANPAN-'
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export const RIOT_READY = () => Boolean(process.env.RIOT_API_KEY)
