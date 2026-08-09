import { BLIZZARD_ID, BLIZZARD_SECRET, getSetting } from './settings'

/**
 * 블리자드 배틀넷 API.
 *
 * 다른 게임사와 달리 키 한 줄이 아니라 아이디와 비밀키 두 개를 받고,
 * 그걸로 먼저 출입증(토큰)을 받아온 다음 그 출입증으로 부른다.
 * 출입증은 하루짜리라 받아두고 돌려 쓴다.
 *
 * 되는 게임과 안 되는 게임이 갈린다.
 *  - 와우: 서버 + 캐릭터명으로 레벨·아이템 레벨·직업까지 나온다
 *  - 디아블로 3: 배틀태그로 파라곤과 영웅들이 나온다
 *  - 오버워치: 블리자드가 아예 열지 않았다. 손으로 적는 수밖에 없다
 *  - 스타2: 닉네임으로 찾을 수가 없다. 프로필 번호를 알아야 한다
 */

export const SYNC_COOLDOWN_MS = 10 * 60 * 1000
const TIMEOUT_MS = 8000

export class BlizzardError extends Error {
  detail?: string
  constructor(message: string, detail?: string) {
    super(message)
    this.detail = detail
  }
}

export type BlizzardGame = 'wow' | 'd3'

function host() {
  return process.env.BLIZZARD_API_BASE || 'https://kr.api.blizzard.com'
}

function oauthHost() {
  return process.env.BLIZZARD_OAUTH_BASE || 'https://oauth.battle.net'
}

export async function blizzardKeyStatus() {
  const id = process.env.BLIZZARD_CLIENT_ID?.trim() || (await getSetting(BLIZZARD_ID))
  const secret = process.env.BLIZZARD_CLIENT_SECRET?.trim() || (await getSetting(BLIZZARD_SECRET))
  const fromEnv = Boolean(process.env.BLIZZARD_CLIENT_ID?.trim())
  return {
    set: Boolean(id && secret),
    source: id && secret ? ((fromEnv ? 'env' : 'db') as 'env' | 'db') : null,
    // 화면에는 아이디 끝자리만 나간다. 비밀키는 있는지 없는지만 알린다.
    value: id ?? null,
    hasSecret: Boolean(secret),
  }
}

// ─────────────────────────── 출입증 ───────────────────────────

let token: { value: string; until: number } | null = null

/**
 * 담아둔 출입증을 버린다.
 * 아이디나 비밀키를 바꾸면 옛 출입증이 하루 동안 살아 있어서, 잘못된 키를
 * 넣어도 "정상" 이라고 나온다. 바꾸는 쪽에서 이걸 불러줘야 한다.
 */
export function resetBlizzardToken() {
  token = null
}

async function accessToken(): Promise<string> {
  if (token && Date.now() < token.until) return token.value

  const id = process.env.BLIZZARD_CLIENT_ID?.trim() || (await getSetting(BLIZZARD_ID))
  const secret = process.env.BLIZZARD_CLIENT_SECRET?.trim() || (await getSetting(BLIZZARD_SECRET))
  if (!id || !secret) {
    throw new BlizzardError('블리자드 연동이 아직 준비되지 않았습니다. 관리자에게 알려주세요.')
  }

  const res = await fetch(`${oauthHost()}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  }).catch(() => null)

  if (!res || !res.ok) {
    throw new BlizzardError(
      '블리자드 아이디·비밀키가 잘못되었습니다. 관리자 화면에서 확인해주세요.',
      res ? `HTTP ${res.status} (토큰 발급)` : '연결 실패 (토큰 발급)',
    )
  }

  const body = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!body.access_token) throw new BlizzardError('블리자드 출입증을 받지 못했습니다.')

  // 만료 1분 전에 미리 새로 받는다
  token = {
    value: body.access_token,
    until: Date.now() + Math.max((body.expires_in ?? 3600) - 60, 60) * 1000,
  }
  return token.value
}

async function ask<T>(path: string): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${host()}${path}`, {
      headers: { Authorization: `Bearer ${await accessToken()}` },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof BlizzardError) throw err
    throw new BlizzardError('블리자드 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해주세요.')
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    // 출입증이 상했을 수 있으니 버리고 다음에 새로 받게 한다
    token = null
    throw new BlizzardError(
      '블리자드 아이디·비밀키가 잘못되었습니다. 관리자 화면에서 확인해주세요.',
      `HTTP ${res.status} ${path}`,
    )
  }
  if (res.status === 429) {
    throw new BlizzardError('요청이 몰리고 있습니다. 잠시 뒤 다시 시도해주세요.', 'HTTP 429')
  }
  if (!res.ok) {
    console.error('[blizzard]', res.status, path)
    throw new BlizzardError('블리자드에서 정보를 가져오지 못했습니다.', `HTTP ${res.status} ${path}`)
  }
  return (await res.json()) as T
}

export type BlizzardStats = {
  tier: string | null
  detail: string | null
  stats: Record<string, number | string> | null
}

// ─────────────────────────── 월드 오브 워크래프트 ───────────────────────────

/**
 * 서버 이름은 사람이 "하이잘" 이라고 쓰지만 주소에는 "hyjal" 이 들어간다.
 * 그 표를 블리자드가 주므로 받아서 담아둔다. 서버가 늘어도 따라간다.
 */
let realmSlugs: Map<string, string> | null = null

async function realmSlug(name: string): Promise<string | null> {
  const clean = name.trim()
  if (!clean) return null

  if (!realmSlugs) {
    const list = await ask<{ realms?: { name?: string; slug?: string }[] }>(
      '/data/wow/realm/index?namespace=dynamic-kr&locale=ko_KR',
    ).catch(() => null)
    if (list?.realms) {
      realmSlugs = new Map(
        list.realms
          .filter((r) => r.name && r.slug)
          .map((r) => [r.name!.replace(/\s/g, ''), r.slug!]),
      )
    }
  }

  const hit = realmSlugs?.get(clean.replace(/\s/g, ''))
  if (hit) return hit
  // 표를 못 받았거나 없는 이름이면, 영문으로 적었을 수 있으니 그대로 써본다
  return /^[a-zA-Z-]+$/.test(clean) ? clean.toLowerCase() : null
}

export async function lookupWow(name: string, realm: string) {
  const slug = await realmSlug(realm)
  if (!slug) return null
  const found = await ask<{ id?: number; name?: string }>(
    `/profile/wow/character/${slug}/${encodeURIComponent(name.trim().toLowerCase())}?namespace=profile-kr&locale=ko_KR`,
  )
  // 서버가 다르면 같은 이름이 여럿 있을 수 있어, 서버까지 넣어야 한 사람이 된다
  return found?.id ? { id: `${slug}:${found.id}`, name: found.name ?? name } : null
}

export async function wowStats(externalId: string, name: string): Promise<BlizzardStats> {
  const slug = externalId.split(':')[0]
  if (!slug || !name) return { tier: null, detail: null, stats: null }

  const p = await ask<{
    name?: string
    level?: number
    equipped_item_level?: number
    average_item_level?: number
    character_class?: { name?: string }
    active_spec?: { name?: string }
    realm?: { name?: string }
    guild?: { name?: string }
    faction?: { name?: string }
  }>(
    `/profile/wow/character/${slug}/${encodeURIComponent(name.toLowerCase())}?namespace=profile-kr&locale=ko_KR`,
  )
  if (!p) return { tier: null, detail: null, stats: null }

  const ilvl = p.equipped_item_level ?? p.average_item_level ?? 0
  const job = [p.active_spec?.name, p.character_class?.name].filter(Boolean).join(' ')

  return {
    tier: p.level ? `${p.level}레벨${job ? ` ${job}` : ''}` : null,
    detail:
      [p.realm?.name, p.guild?.name || null, ilvl ? `아이템 레벨 ${ilvl}` : null]
        .filter(Boolean)
        .join(' · ') || null,
    stats: {
      level: p.level ?? 0,
      itemLevel: ilvl,
      job: p.character_class?.name ?? '',
      world: p.realm?.name ?? '',
    },
  }
}

// ─────────────────────────── 디아블로 3 ───────────────────────────

/** 블리자드가 직업을 영문 표식으로 준다. 그대로 두면 "demon-hunter" 가 나온다. */
const D3_CLASS_KO: Record<string, string> = {
  barbarian: '야만용사',
  crusader: '성전사',
  'demon-hunter': '악마사냥꾼',
  monk: '수도사',
  necromancer: '강령술사',
  'witch-doctor': '부두술사',
  wizard: '마법사',
}

export async function lookupD3(battleTag: string) {
  const tag = battleTag.trim().replace('#', '-')
  if (!/^.+-\d{3,}$/.test(tag)) return null
  const p = await ask<{ battleTag?: string }>(
    `/d3/profile/${encodeURIComponent(tag)}/?locale=ko_KR`,
  )
  return p?.battleTag ? { id: tag, name: p.battleTag } : null
}

export async function d3Stats(externalId: string): Promise<BlizzardStats> {
  const p = await ask<{
    battleTag?: string
    paragonLevel?: number
    paragonLevelSeason?: number
    guildName?: string
    heroes?: { name?: string; class?: string; level?: number }[]
  }>(`/d3/profile/${encodeURIComponent(externalId)}/?locale=ko_KR`)
  if (!p) return { tier: null, detail: null, stats: null }

  const best = (p.heroes ?? []).sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0]
  const job = best?.class ? (D3_CLASS_KO[best.class] ?? best.class) : null
  const paragon = p.paragonLevelSeason || p.paragonLevel || 0

  return {
    tier: paragon ? `파라곤 ${paragon.toLocaleString('ko-KR')}` : null,
    detail:
      [job, p.guildName || null, `영웅 ${(p.heroes ?? []).length}명`]
        .filter(Boolean)
        .join(' · ') || null,
    stats: {
      paragon,
      heroes: (p.heroes ?? []).length,
      job: job ?? '',
    },
  }
}

/** 아이디·비밀키가 실제로 먹히는지 확인한다 */
export async function checkBlizzardKey(): Promise<{ ok: boolean; message: string }> {
  try {
    await accessToken()
    await ask<unknown>('/data/wow/realm/index?namespace=dynamic-kr&locale=ko_KR')
    return { ok: true, message: '블리자드 서버와 정상적으로 통신했습니다.' }
  } catch (err) {
    if (err instanceof BlizzardError) {
      return { ok: false, message: err.detail ? `${err.message} (${err.detail})` : err.message }
    }
    return { ok: false, message: '확인하지 못했습니다.' }
  }
}
