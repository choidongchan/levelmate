import { Icon } from './icon'
import { kdaRatio, LOL_ROLES, tierColor, tierLabel, tierShort, winRate } from '@/lib/riot'
import type { RiotProfile } from '@/lib/riot'

/**
 * 라이엇에서 가져온 전적을 보여주는 조각들.
 * 손으로 적은 티어와 달리 이건 실제 기록이라, 눈에 띄게 둔다.
 */

export function TierBadge({
  riot,
  size = 'sm',
}: {
  riot: RiotProfile
  size?: 'sm' | 'md'
}) {
  const color = tierColor(riot.tier)
  const label = size === 'md' ? tierLabel(riot.tier, riot.division) : tierShort(riot.tier, riot.division)

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md font-black ${
        size === 'md' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      }`}
      style={{ color, backgroundColor: `${color}22` }}
      title={tierLabel(riot.tier, riot.division)}
    >
      {label}
      {riot.verified && <Icon name="check" className="size-2.5" />}
    </span>
  )
}

/** 승/패와 승률. op.gg 처럼 막대로 보여준다. */
export function WinRateBar({ riot }: { riot: RiotProfile }) {
  const rate = winRate(riot)
  if (rate === null) return null
  const total = riot.wins + riot.losses

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-[#f43f5e]/40">
        <span className="h-full bg-[#3b82f6]" style={{ width: `${rate}%` }} />
      </span>
      <span className="shrink-0 text-[10px] tabular-nums">
        <b className={rate >= 55 ? 'text-[#f43f5e]' : ''}>{rate}%</b>
        <span className="text-dim"> ({total})</span>
      </span>
    </span>
  )
}

export function RoleTag({ role }: { role: keyof typeof LOL_ROLES }) {
  return (
    <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
      {LOL_ROLES[role].short}
    </span>
  )
}

/** 최근에 많이 한 챔피언 + 각 승률 */
export function ChampionList({ riot }: { riot: RiotProfile }) {
  if (riot.champions.length === 0) return null
  return (
    <span className="flex flex-wrap gap-1">
      {riot.champions.map((c) => {
        const rate = c.games ? Math.round((c.wins / c.games) * 100) : 0
        return (
          <span
            key={c.id}
            className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-muted"
            title={`${c.games}판 ${c.wins}승`}
          >
            {c.name} <b className={rate >= 55 ? 'text-[#f43f5e]' : 'text-dim'}>{rate}%</b>
          </span>
        )
      })}
    </span>
  )
}

export function KdaText({ riot }: { riot: RiotProfile }) {
  const ratio = kdaRatio(riot)
  if (riot.recentGames === 0) return null
  return (
    <span className="text-[10px] tabular-nums text-dim">
      {riot.kills} / <span className="text-[#f43f5e]">{riot.deaths}</span> / {riot.assists}
      {ratio !== null && <b className="ml-1 text-muted">{ratio.toFixed(2)}</b>}
    </span>
  )
}

/** 한 줄 요약 — 카드에 넣는다 */
export function RiotSummary({ riot }: { riot: RiotProfile }) {
  return (
    <span className="flex items-center gap-1.5">
      <TierBadge riot={riot} />
      {riot.mainRole && <RoleTag role={riot.mainRole} />}
      <WinRateBar riot={riot} />
    </span>
  )
}
