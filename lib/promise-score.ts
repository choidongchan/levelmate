import type { User } from './types'

/**
 * 약속 이행 점수.
 * 노쇼는 0점, 임박 취소는 0.3, 지각은 0.6으로 가중해서 이행률을 낸다.
 * 기록이 없으면 null — 점수 대신 '신규'로 표시한다.
 */
export function promiseScore(u: Pick<User, 'kept' | 'late' | 'cancelLate' | 'noShow'>): number | null {
  const total = u.kept + u.late + u.cancelLate + u.noShow
  if (total === 0) return null
  const weighted = u.kept * 1 + u.late * 0.6 + u.cancelLate * 0.3
  return Math.round((weighted / total) * 100)
}

export function promiseGrade(score: number | null): {
  label: string
  color: string
  desc: string
} {
  if (score === null) {
    return { label: '신규', color: '#94a3b8', desc: '아직 약속 기록이 없어요' }
  }
  if (score >= 95) return { label: '최상', color: '#34d399', desc: '약속을 아주 잘 지켜요' }
  if (score >= 85) return { label: '좋음', color: '#22d3ee', desc: '약속을 잘 지키는 편이에요' }
  if (score >= 70) return { label: '보통', color: '#fbbf24', desc: '가끔 늦거나 취소한 적이 있어요' }
  return { label: '주의', color: '#f43f5e', desc: '노쇼·취소 기록이 있어요' }
}

export function promiseTotal(u: Pick<User, 'kept' | 'late' | 'cancelLate' | 'noShow'>): number {
  return u.kept + u.late + u.cancelLate + u.noShow
}

export function ratingAvg(u: Pick<User, 'ratingSum' | 'reviewCount'>): number | null {
  if (u.reviewCount === 0) return null
  return Math.round((u.ratingSum / u.reviewCount) * 10) / 10
}
