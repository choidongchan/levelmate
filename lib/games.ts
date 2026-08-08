import type { GameKey } from './types'

/**
 * 게임마다 다른 티어 체계와 자리(역할).
 *
 * 라이엇처럼 공식 API 로 실제 값을 가져올 수 있는 게임은 그쪽이 우선이고,
 * 여기 있는 것은 아직 자동으로 못 가져오는 게임에서 직접 고르게 하려는 것이다.
 * 자유 입력으로 받으면 "골드3", "골3", "gold 3" 이 다 섞여 걸러낼 수가 없다.
 */

export type GameRole = { key: string; label: string; short: string }

/** 자리 개념이 있는 게임만 둔다. 없는 게임은 이 목록에 없다. */
export const GAME_ROLES: Partial<Record<GameKey, GameRole[]>> = {
  lol: [
    { key: 'TOP', label: '탑', short: '탑' },
    { key: 'JUNGLE', label: '정글', short: '정글' },
    { key: 'MID', label: '미드', short: '미드' },
    { key: 'ADC', label: '원딜', short: '원딜' },
    { key: 'SUPPORT', label: '서포터', short: '서폿' },
  ],
  overwatch: [
    { key: 'TANK', label: '탱커', short: '탱' },
    { key: 'DAMAGE', label: '딜러', short: '딜' },
    { key: 'HEALER', label: '힐러', short: '힐' },
  ],
  valorant: [
    { key: 'DUELIST', label: '타격대', short: '타격' },
    { key: 'INITIATOR', label: '척후대', short: '척후' },
    { key: 'CONTROLLER', label: '전략가', short: '전략' },
    { key: 'SENTINEL', label: '감시자', short: '감시' },
  ],
}

/** 티어 목록. 낮은 것부터 높은 순. */
export const GAME_TIERS: Partial<Record<GameKey, string[]>> = {
  lol: [
    '아이언',
    '브론즈',
    '실버',
    '골드',
    '플래티넘',
    '에메랄드',
    '다이아몬드',
    '마스터',
    '그랜드마스터',
    '챌린저',
  ],
  valorant: [
    '아이언',
    '브론즈',
    '실버',
    '골드',
    '플래티넘',
    '다이아몬드',
    '초월자',
    '불멸',
    '레디언트',
  ],
  overwatch: [
    '브론즈',
    '실버',
    '골드',
    '플래티넘',
    '다이아몬드',
    '마스터',
    '그랜드마스터',
    '챔피언',
  ],
  pubg: ['브론즈', '실버', '골드', '플래티넘', '다이아몬드', '마스터'],
  fconline: ['디비전 10', '디비전 9', '디비전 8', '디비전 7', '디비전 6', '디비전 5', '디비전 4', '디비전 3', '디비전 2', '디비전 1'],
}

/** 티어 목록이 없는 게임(메이플·기타)은 자유롭게 적게 둔다 */
export function tiersFor(game: GameKey) {
  return GAME_TIERS[game] ?? null
}

export function rolesFor(game: GameKey) {
  return GAME_ROLES[game] ?? null
}

export function roleLabel(game: GameKey, key: string | null): string | null {
  if (!key) return null
  return GAME_ROLES[game]?.find((r) => r.key === key)?.label ?? null
}

export function roleShort(game: GameKey, key: string | null): string | null {
  if (!key) return null
  return GAME_ROLES[game]?.find((r) => r.key === key)?.short ?? null
}

/** 어떤 게임의 자리든 받아준다. 서버에서 게임에 맞는지 다시 본다. */
export const ALL_ROLE_KEYS = [
  ...new Set(Object.values(GAME_ROLES).flatMap((rs) => rs.map((r) => r.key))),
]

/** 게임별 실력 표시를 어떻게 부를지 */
export const SKILL_LABEL: Record<GameKey, string> = {
  lol: '티어',
  valorant: '티어',
  overwatch: '티어',
  pubg: '티어',
  fconline: '등급',
  maple: '레벨 / 직업',
  etc: '실력',
}
