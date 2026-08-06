'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { BarRow, PageTitle, Panel, StatCard, Tag } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { useStore } from '@/lib/store'
import { BOOKING_STATUS, FEE_RATE } from '@/lib/types'

export default function AdminDashboard() {
  const s = useStore()

  const m = useMemo(() => {
    const done = s.bookings.filter((b) => b.status === 'COMPLETED')
    const gross = done.reduce((sum, b) => sum + b.amount, 0)
    const region = new Map<string, number>()
    for (const l of s.listings) region.set(l.region, (region.get(l.region) ?? 0) + 1)

    return {
      users: s.users.length,
      unverified: s.users.filter((u) => !u.verified).length,
      banned: s.users.filter((u) => u.bannedAt).length,
      listings: s.listings.filter((l) => l.active).length,
      hidden: s.listings.filter((l) => !l.active).length,
      bookings: s.bookings.length,
      pending: s.bookings.filter((b) => b.status === 'REQUESTED').length,
      noShow: s.bookings.filter((b) => b.status === 'NO_SHOW').length,
      gross,
      fee: Math.round(gross * FEE_RATE),
      unsettled: s.bookings.filter((b) => b.status === 'COMPLETED' && !b.settled && b.amount > 0).length,
      regions: [...region.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    }
  }, [s])

  const recent = [...s.bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  const newUsers = [...s.users]
    .filter((u) => u.role !== 'ADMIN')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <>
      <PageTitle title="대시보드" desc="오늘의 운영 현황" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="누적 거래액" value={won(m.gross)} icon="won" tone="brand" />
        <StatCard label={`수수료 (${Math.round(FEE_RATE * 100)}%)`} value={won(m.fee)} icon="chart" />
        <StatCard label="전체 회원" value={`${m.users}명`} sub={`미인증 ${m.unverified} · 정지 ${m.banned}`} icon="users" />
        <StatCard label="활성 글" value={`${m.listings}개`} sub={`숨김 ${m.hidden}`} icon="list" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 예약" value={`${m.bookings}건`} icon="calendar" />
        <StatCard label="수락 대기" value={`${m.pending}건`} tone={m.pending > 0 ? 'warn' : undefined} />
        <StatCard label="노쇼" value={`${m.noShow}건`} tone={m.noShow > 0 ? 'bad' : undefined} />
        <StatCard label="정산 대기" value={`${m.unsettled}건`} tone={m.unsettled > 0 ? 'warn' : undefined} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel
          title="최근 예약"
          action={
            <Link href="/admin/bookings" className="text-[11px] text-dim hover:text-muted">
              전체보기
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">예약이 없습니다</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {recent.map((b) => {
                const st = BOOKING_STATUS[b.status]
                const listing = s.listings.find((l) => l.id === b.listingId)
                return (
                  <li key={b.id} className="flex items-center gap-2 py-2.5">
                    <Tag color={st.color}>{st.label}</Tag>
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {listing?.title ?? '삭제된 글'}
                    </span>
                    <span className="shrink-0 text-xs font-bold">
                      {b.amount === 0 ? '무료' : won(b.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="신규 회원"
          action={
            <Link href="/admin/users" className="text-[11px] text-dim hover:text-muted">
              전체보기
            </Link>
          }
        >
          {newUsers.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">회원이 없습니다</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {newUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2.5 py-2.5">
                  <UserArt user={u} className="size-8 shrink-0 rounded-lg" sizes="32px" />
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(u.nickname)}`}
                    className="min-w-0 flex-1 truncate text-xs font-semibold hover:underline"
                  >
                    {u.nickname}
                  </Link>
                  {!u.verified && <Tag color="#fbbf24">미인증</Tag>}
                  <span className="shrink-0 text-[10px] text-dim">
                    {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="지역별 글"
          action={
            <Link href="/admin/stats" className="text-[11px] text-dim hover:text-muted">
              통계 전체
            </Link>
          }
        >
          {m.regions.length === 0 ? (
            <p className="py-8 text-center text-xs text-dim">데이터가 없습니다</p>
          ) : (
            <ul>
              {m.regions.map(([r, c]) => (
                <BarRow key={r} label={r} value={c} max={m.regions[0][1]} suffix="개" />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="처리할 일">
          <ul className="flex flex-col gap-2">
            <TodoRow
              label="수락 대기 예약"
              count={m.pending}
              href="/admin/bookings"
              icon="calendar"
            />
            <TodoRow label="미인증 회원" count={m.unverified} href="/admin/users" icon="id" />
            <TodoRow label="정산 대기" count={m.unsettled} href="/admin/settlements" icon="won" />
            <TodoRow label="정지된 회원" count={m.banned} href="/admin/users" icon="ban" />
          </ul>
        </Panel>
      </div>
    </>
  )
}

function TodoRow({
  label,
  count,
  href,
  icon,
}: {
  label: string
  count: number
  href: string
  icon: 'calendar' | 'id' | 'won' | 'ban'
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${
          count > 0 ? 'bg-white/5 hover:bg-white/8' : 'opacity-45'
        }`}
      >
        <Icon name={icon} className="size-4 shrink-0 text-dim" />
        <span className="flex-1 text-xs">{label}</span>
        <span className={`text-sm font-black ${count > 0 ? 'text-brand-bright' : 'text-dim'}`}>
          {count}
        </span>
        <Icon name="chevronRight" className="size-3.5 text-dim" />
      </Link>
    </li>
  )
}
