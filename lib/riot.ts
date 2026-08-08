/**
 * 라이엇 게임즈 데이터 관련 상수와 표시 규칙.
 * 서버·화면 양쪽에서 쓰므로 여기에는 비밀 값이나 서버 전용 코드를 두지 않는다.
 */

export type LolRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'

export const LOL_ROLES: Record<LolRole, { label: string; short: string }> = {
  TOP: { label: '탑', short: '탑' },
  JUNGLE: { label: '정글', short: '정글' },
  MID: { label: '미드', short: '미드' },
  ADC: { label: '원딜', short: '원딜' },
  SUPPORT: { label: '서포터', short: '서폿' },
}

export const LOL_ROLE_KEYS = Object.keys(LOL_ROLES) as LolRole[]

/** 라이엇이 주는 자리 이름을 우리 이름으로 바꾼다 */
export function toRole(teamPosition: string | null | undefined): LolRole | null {
  switch (teamPosition) {
    case 'TOP':
      return 'TOP'
    case 'JUNGLE':
      return 'JUNGLE'
    case 'MIDDLE':
      return 'MID'
    case 'BOTTOM':
      return 'ADC'
    case 'UTILITY':
      return 'SUPPORT'
    default:
      return null
  }
}

export type Tier =
  | 'IRON'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'EMERALD'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER'
  | 'CHALLENGER'

export const TIERS: Record<Tier, { label: string; short: string; color: string; order: number }> = {
  IRON: { label: '아이언', short: 'I', color: '#8a8a8a', order: 1 },
  BRONZE: { label: '브론즈', short: 'B', color: '#a4744a', order: 2 },
  SILVER: { label: '실버', short: 'S', color: '#9aa9b5', order: 3 },
  GOLD: { label: '골드', short: 'G', color: '#e0b544', order: 4 },
  PLATINUM: { label: '플래티넘', short: 'P', color: '#4ec1c9', order: 5 },
  EMERALD: { label: '에메랄드', short: 'E', color: '#3fbf7f', order: 6 },
  DIAMOND: { label: '다이아몬드', short: 'D', color: '#6f8ff5', order: 7 },
  MASTER: { label: '마스터', short: 'M', color: '#a855f7', order: 8 },
  GRANDMASTER: { label: '그랜드마스터', short: 'GM', color: '#f43f5e', order: 9 },
  CHALLENGER: { label: '챌린저', short: 'C', color: '#f0c04a', order: 10 },
}

export const TIER_KEYS = Object.keys(TIERS) as Tier[]

/** 마스터 위로는 단계(I~IV)가 없다 */
const NO_DIVISION = new Set<Tier>(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

/** "다이아 II" 처럼 사람이 읽는 형태로 */
export function tierLabel(tier: string | null, division: string | null): string {
  if (!tier) return '언랭'
  const t = TIERS[tier as Tier]
  if (!t) return '언랭'
  if (NO_DIVISION.has(tier as Tier)) return t.label
  return division ? `${t.label} ${division}` : t.label
}

/** op.gg 처럼 짧게 — "D2", "M" */
export function tierShort(tier: string | null, division: string | null): string {
  if (!tier) return 'UR'
  const t = TIERS[tier as Tier]
  if (!t) return 'UR'
  if (NO_DIVISION.has(tier as Tier)) return t.short
  return `${t.short}${{ I: 1, II: 2, III: 3, IV: 4 }[division ?? ''] ?? ''}`
}

export function tierColor(tier: string | null): string {
  return TIERS[tier as Tier]?.color ?? '#94a3b8'
}

/** 라이엇 계정을 연결한 사람에게만 붙는 실제 전적 */
export type RiotProfile = {
  gameName: string
  tagLine: string
  tier: string | null
  division: string | null
  lp: number
  wins: number
  losses: number
  mainRole: LolRole | null
  champions: { id: number; name: string; games: number; wins: number }[]
  kills: number
  deaths: number
  assists: number
  recentGames: number
  /** 게임 클라이언트로 본인 계정임을 확인했는지 */
  verified: boolean
  syncedAt: string | null
  /** 본인에게만 내려간다. 게임 설정에 넣어야 할 코드. */
  verifyCode?: string | null
}

export function winRate(p: { wins: number; losses: number }): number | null {
  const total = p.wins + p.losses
  return total === 0 ? null : Math.round((p.wins / total) * 100)
}

/** KDA 평점. 데스가 0이면 라이엇 표기대로 Perfect 로 본다. */
export function kdaRatio(p: { kills: number; deaths: number; assists: number }): number | null {
  if (p.kills + p.deaths + p.assists === 0) return null
  if (p.deaths === 0) return null
  return Math.round(((p.kills + p.assists) / p.deaths) * 100) / 100
}
