'use client'

import { useMemo } from 'react'
import { BarRow, PageTitle, Panel, StatCard } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import { promiseScore } from '@/lib/promise-score'
import { useStore } from '@/lib/store'
import { GAMES, LISTING_KINDS, MEET_MODES, type GameKey, type ListingKind, type MeetMode } from '@/lib/types'

export default function AdminStatsPage() {
  const s = useStore()

  const m = useMemo(() => {
    const tally = <T extends string>(items: T[]) => {
      const map = new Map<T, number>()
      for (const x of items) map.set(x, (map.get(x) ?? 0) + 1)
      return [...map.entries()].sort((a, b) => b[1] - a[1])
    }

    // 매출 순위 — 완료된 예약 기준
    const earn = new Map<string, number>()
    for (const b of s.bookings) {
      if (b.status !== 'COMPLETED' || b.amount === 0) continue
      earn.set(b.hostId, (earn.get(b.hostId) ?? 0) + b.amount)
    }
    const topEarners = [...earn.entries()]
      .map(([id, amount]) => ({ user: s.users.find((u) => u.id === id), amount }))
      .filter((x) => x.user)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    // 약속 점수 순위 — 기록이 있는 사람만
    const topPromise = s.users
      .map((u) => ({ user: u, score: promiseScore(u), total: u.kept + u.late + u.cancelLate + u.noShow }))
      .filter((x) => x.score !== null && x.total >= 3)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8)

    // 주의가 필요한 사람
    const risky = s.users
      .map((u) => ({ user: u, score: promiseScore(u) }))
      .filter((x) => x.score !== null && x.score < 85)
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 5)

    // 가입 추이 (최근 6개월)
    const months = new Map<string, number>()
    for (const u of s.users) {
      const k = u.createdAt.slice(0, 7)
      months.set(k, (months.get(k) ?? 0) + 1)
    }
    const signup = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6)

    return {
      byRegionUser: tally(s.users.map((u) => u.region)),
      byRegionListing: tally(s.listings.map((l) => l.region)),
      byGame: tally(s.listings.map((l) => l.mainGame)) as [GameKey, number][],
      byKind: tally(s.listings.map((l) => l.kind)) as [ListingKind, number][],
      byMode: tally(s.listings.map((l) => l.meetMode)) as [MeetMode, number][],
      topEarners,
      topPromise,
      risky,
      signup,
    }
  }, [s])

  const max = (arr: [string, number][] | { amount: number }[] | { score: number | null }[]) => {
    if (arr.length === 0) return 1
    const first = arr[0] as unknown
    if (Array.isArray(first)) return (arr as [string, number][])[0][1]
    if ('amount' in (first as object)) return (arr as { amount: number }[])[0].amount
    return 100
  }

  return (
    <>
      <PageTitle title="통계" desc="지역 · 게임 · 순위 · 가입 추이" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="지역 수" value={`${m.byRegionListing.length}곳`} icon="location" />
        <StatCard label="다뤄지는 게임" value={`${m.byGame.length}종`} icon="gamepad" />
        <StatCard
          label="오프라인 비중"
          value={`${pct(s.listings.filter((l) => l.meetMode !== 'ONLINE').length, s.listings.length)}%`}
          sub="만나서 진행"
        />
        <StatCard
          label="유료 비중"
          value={`${pct(s.listings.filter((l) => l.pricePerHour > 0).length, s.listings.length)}%`}
          tone="brand"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="지역별 글">
          <List rows={m.byRegionListing} suffix="개" />
        </Panel>

        <Panel title="지역별 회원">
          <List rows={m.byRegionUser} suffix="명" />
        </Panel>

        <Panel title="게임별 글">
          <List rows={m.byGame.map(([g, c]) => [GAMES[g].name, c])} suffix="개" />
        </Panel>

        <Panel title="유형·방식 분포">
          <List rows={m.byKind.map(([k, c]) => [LISTING_KINDS[k].label, c])} suffix="개" />
          <div className="my-3 border-t border-line" />
          <List rows={m.byMode.map(([k, c]) => [MEET_MODES[k].label, c])} suffix="개" />
        </Panel>

        <Panel title="매출 순위">
          {m.topEarners.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">완료된 유료 예약이 없습니다</p>
          ) : (
            <ul>
              {m.topEarners.map((x, i) => (
                <BarRow
                  key={x.user!.id}
                  rank={i + 1}
                  label={x.user!.nickname}
                  value={x.amount}
                  max={max(m.topEarners)}
                  suffix="원"
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="약속 점수 순위">
          {m.topPromise.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">기록이 쌓이면 표시됩니다</p>
          ) : (
            <ul>
              {m.topPromise.map((x, i) => (
                <BarRow
                  key={x.user.id}
                  rank={i + 1}
                  label={x.user.nickname}
                  value={x.score ?? 0}
                  max={100}
                  suffix="점"
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="주의가 필요한 회원">
          {m.risky.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">없습니다</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {m.risky.map((x) => (
                <li key={x.user.id} className="flex items-center gap-2 py-2.5 text-xs">
                  <Icon name="alert" className="size-3.5 shrink-0 text-[#f43f5e]" />
                  <span className="flex-1 truncate font-semibold">{x.user.nickname}</span>
                  <span className="text-dim">
                    노쇼 {x.user.noShow} · 취소 {x.user.cancelLate}
                  </span>
                  <span className="w-10 text-right font-black text-[#f43f5e]">{x.score}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="가입 추이">
          {m.signup.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">데이터가 없습니다</p>
          ) : (
            <ul>
              {m.signup.map(([month, c]) => (
                <BarRow
                  key={month}
                  label={month.replace('-', '년 ') + '월'}
                  value={c}
                  max={Math.max(...m.signup.map((x) => x[1]))}
                  suffix="명"
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-4 flex gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-dim" />
        <span>
          <b className="text-white">접속 위치·기기·유입 경로</b>는 서버에 접속 기록을 남겨야
          집계할 수 있습니다. DB를 연결한 뒤에 추가하겠습니다. 지금 보이는 지역은 회원이
          직접 설정한 활동 지역입니다.
        </span>
      </p>
    </>
  )
}

function List({ rows, suffix }: { rows: [string, number][]; suffix: string }) {
  if (rows.length === 0) return <p className="py-8 text-center text-xs text-dim">데이터가 없습니다</p>
  const top = rows[0][1]
  return (
    <ul>
      {rows.map(([label, value]) => (
        <BarRow key={label} label={label} value={value} max={top} suffix={suffix} />
      ))}
    </ul>
  )
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}
