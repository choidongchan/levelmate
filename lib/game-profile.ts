import { kdaRatio, LOL_ROLES, tierLabel, winRate } from './riot'
import { GAMES, type GameKey, type User } from './types'

/**
 * 연결된 게임 계정을 화면이 쓰기 좋은 한 가지 모양으로 맞춘다.
 *
 * 롤은 라이엇에서, 나머지는 게임사마다 다른 곳에서 가져온다. 담기는 값도
 * 다 다르다. 그대로 두면 화면마다 게임별 분기가 생겨서, 카드에는 롤만
 * 나오고 프로필에는 아무것도 안 나오는 지금 같은 일이 벌어진다.
 *
 * 그래서 "어느 게임, 무슨 등급, 한 줄 요약, 보여줄 숫자 몇 개" 로 한 번
 * 눕히고, 화면은 이것만 본다.
 */

export type GameStat = { label: string; value: string; hot?: boolean }

export type GameProfileView = {
  game: GameKey
  gameName: string
  gameShort: string
  gameColor: string
  /** 계정 이름. 롤은 이름#태그 */
  account: string
  /** 카카오 / 스팀처럼 계정이 있는 곳 */
  platform: string | null
  /** "다이아몬드 3" · "Lv.285 아델" — 바로 보여줄 수 있는 등급 */
  tier: string | null
  tierColor: string
  /** "스쿼드 1인칭 · 4123 RP · 128판" */
  detail: string | null
  /** 주로 서는 자리 */
  role: string | null
  /** 자리 아이콘을 고르기 위한 열쇠 (TOP, MID …) */
  roleKey: string | null
  /** 본인 확인까지 마쳤는지 (지금은 라이엇만 가능) */
  verified: boolean
  /**
   * 승률 막대. 이겼다/졌다로 끝나는 게임만 그린다.
   * 배틀로얄은 우승률 9% 가 아주 잘하는 것이라, 막대로 그리면
   * 절반도 못 채워서 못하는 사람처럼 보인다. 그래서 숫자로만 둔다.
   */
  record: { rate: number; wins: number; losses: number } | null
  stats: GameStat[]
  /** 자주 하는 챔피언 등 */
  picks: { name: string; rate: number; games: number }[]
  syncedAt: string | null
}

const PLATFORM_LABEL: Record<string, string> = { kakao: '카카오', steam: '스팀' }

/**
 * 등급 색.
 *
 * 게임마다 등급 이름이 달라도 골드는 금색, 다이아는 하늘색이어야 한눈에
 * 읽힌다. 그래서 이름에 든 낱말로 고른다.
 */
const TIER_TONES: [string, string][] = [
  ['챌린저', '#f4c874'],
  ['슈퍼챌린지', '#f4c874'],
  ['챌린지', '#e8b4ff'],
  ['그랜드마스터', '#f43f5e'],
  ['마스터', '#c471ed'],
  ['레디언트', '#fef08a'],
  ['불멸', '#e0416a'],
  ['초월자', '#c471ed'],
  ['월드클래스', '#38bdf8'],
  ['다이아', '#4bb3d4'],
  ['에메랄드', '#34d399'],
  ['플래티넘', '#4ba39a'],
  ['프로', '#4ba39a'],
  ['골드', '#d8a750'],
  ['실버', '#9aa4af'],
  ['브론즈', '#a0714f'],
  ['아이언', '#6b7280'],
  ['서바이버', '#f97316'],
  ['챔피언', '#fbbf24'],
  ['유망주', '#94a3b8'],
  ['아마추어', '#6b7280'],
]

export function tierTone(tier: string | null, fallback: string) {
  if (!tier) return fallback
  for (const [word, color] of TIER_TONES) if (tier.includes(word)) return color
  return fallback
}

/** 이 회원이 연결해 둔 게임들. 없으면 빈 배열. */
export function gameProfiles(user: User): GameProfileView[] {
  const out: GameProfileView[] = []
  const riot = user.riot

  if (riot) {
    const rate = winRate(riot)
    const ratio = kdaRatio(riot)
    const tier = riot.tier ? tierLabel(riot.tier, riot.division) : null
    out.push({
      game: 'lol',
      gameName: GAMES.lol.name,
      gameShort: GAMES.lol.short,
      gameColor: GAMES.lol.color,
      account: `${riot.gameName}#${riot.tagLine}`,
      platform: null,
      tier: tier ?? '언랭',
      tierColor: tierTone(tier, GAMES.lol.color),
      detail: riot.lp ? `${riot.lp} LP` : null,
      role: riot.mainRole ? LOL_ROLES[riot.mainRole].label : null,
      roleKey: riot.mainRole ?? null,
      verified: riot.verified,
      record: rate === null ? null : { rate, wins: riot.wins, losses: riot.losses },
      stats: [
        ...(ratio !== null
          ? [{ label: 'KDA', value: ratio.toFixed(2), hot: ratio >= 3 }]
          : []),
        ...(riot.recentGames
          ? [{ label: '최근', value: `${riot.recentGames}판` }]
          : []),
      ],
      picks: riot.champions.map((c) => ({
        name: c.name,
        games: c.games,
        rate: c.games ? Math.round((c.wins / c.games) * 100) : 0,
      })),
      syncedAt: riot.syncedAt,
    })
  }

  for (const g of user.gameAccounts ?? []) {
    const meta = GAMES[g.game] ?? GAMES.etc
    const s = g.stats ?? {}
    const num = (k: string) => (typeof s[k] === 'number' ? (s[k] as number) : null)


    out.push({
      game: g.game,
      gameName: meta.name,
      gameShort: meta.short,
      gameColor: meta.color,
      account: g.name,
      platform: g.platform ? (PLATFORM_LABEL[g.platform] ?? g.platform) : null,
      tier: g.tier,
      tierColor: tierTone(g.tier, meta.color),
      detail: g.detail,
      role: null,
      roleKey: null,
      // 라이엇 말고는 본인 확인 수단이 없다. 있는 척하지 않는다.
      verified: false,
      record: null,
      stats: statsFor(g.game, num),
      picks: [],
      syncedAt: g.syncedAt,
    })
  }

  return out
}

/** 게임마다 보여줄 값이 다르다. 없는 값은 빼고 넣는다. */
function statsFor(game: GameKey, num: (k: string) => number | null): GameStat[] {
  const rows: GameStat[] = []
  const push = (label: string, value: number | null, fmt?: (n: number) => string) => {
    if (value === null || value === 0) return
    rows.push({ label, value: fmt ? fmt(value) : value.toLocaleString('ko-KR') })
  }

  if (game === 'pubg') {
    const kda = num('kda')
    if (kda !== null) rows.push({ label: 'KDA', value: String(kda), hot: kda >= 3 })
    push('RP', num('rp'))
    push('평균 딜', num('avgDamage'))
    push('우승', num('wins'), (n) => `${n}회`)
    push('판수', num('rounds'), (n) => `${n}판`)
    // 배그 우승률은 한 자릿수가 정상이다. 그대로 두면 낮아 보이므로 판수와 같이 둔다.
    push('우승률', num('winRate'), (n) => `${n}%`)
  } else if (game === 'maple') {
    push('레벨', num('level'))
    push('전투력', num('power'))
  } else if (game === 'fconline') {
    push('구단 레벨', num('level'))
  }
  return rows
}

/**
 * 목록에서 앞에 세울 순서.
 *
 * 게임이 다르면 등급을 견줄 수가 없다. 배그 다이아와 FC 챌린지1 중
 * 누가 위인지 정할 방법이 없다. 그래서 "얼마나 확인됐는가" 로만 줄을
 * 세운다. 확인된 계정이 있는 사람이 먼저 보이는 편이 서비스에 맞다.
 */
export function trustScore(user: User): number {
  const games = gameProfiles(user)
  let score = 0
  for (const g of games) {
    score += 10
    if (g.tier) score += 5
    if (g.verified) score += 20
  }
  if (user.verified) score += 15
  return score
}
