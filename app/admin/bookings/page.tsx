'use client'

import { useMemo, useState } from 'react'
import { Chip, Empty, PageTitle, SearchBox, StatCard, Tag } from '@/components/admin-ui'
import { won } from '@/lib/format'
import { setBookingStatus, useStore } from '@/lib/store'
import { BOOKING_STATUS, MEET_MODES, type BookingStatus } from '@/lib/types'

const STATES: (BookingStatus | 'ALL')[] = [
  'ALL',
  'REQUESTED',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

export default function AdminBookingsPage() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [st, setSt] = useState<BookingStatus | 'ALL'>('ALL')

  const rows = useMemo(() => {
    const t = q.trim()
    return s.bookings
      .filter((b) => (st === 'ALL' ? true : b.status === st))
      .filter((b) => {
        if (!t) return true
        const l = s.listings.find((x) => x.id === b.listingId)
        const m = s.users.find((u) => u.id === b.memberId)
        const h = s.users.find((u) => u.id === b.hostId)
        return (
          (l?.title.includes(t) ?? false) ||
          (m?.nickname.includes(t) ?? false) ||
          (h?.nickname.includes(t) ?? false) ||
          b.checkInCode.includes(t.toUpperCase())
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [s, q, st])

  const count = (x: BookingStatus) => s.bookings.filter((b) => b.status === x).length

  return (
    <>
      <PageTitle title="예약 관리" desc="상태 확인 및 강제 처리" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체" value={`${s.bookings.length}건`} icon="calendar" />
        <StatCard label="수락 대기" value={`${count('REQUESTED')}건`} tone="warn" />
        <StatCard label="진행 중" value={`${count('CHECKED_IN')}건`} tone="brand" />
        <StatCard label="노쇼" value={`${count('NO_SHOW')}건`} tone="bad" />
      </div>

      <div className="mb-3 flex flex-col gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="글 제목·닉네임·체크인 코드로 검색" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {STATES.map((x) => (
            <Chip key={x} active={st === x} onClick={() => setSt(x)}>
              {x === 'ALL' ? '전체' : BOOKING_STATUS[x].label}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mb-2 px-1 text-xs text-dim">{rows.length}건</p>

      {rows.length === 0 ? (
        <Empty icon="calendar" text="조건에 맞는 예약이 없습니다" />
      ) : (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {rows.map((b) => {
            const l = s.listings.find((x) => x.id === b.listingId)
            const member = s.users.find((u) => u.id === b.memberId)
            const host = s.users.find((u) => u.id === b.hostId)
            const info = BOOKING_STATUS[b.status]
            return (
              <div key={b.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-1.5">
                  <Tag color={info.color}>{info.label}</Tag>
                  <Tag color="#9797b4">{MEET_MODES[b.meetMode].short}</Tag>
                  {b.settled && <Tag color="#34d399">정산완료</Tag>}
                  <span className="ml-auto text-sm font-bold">
                    {b.amount === 0 ? '무료' : won(b.amount)}
                  </span>
                </div>

                <p className="mt-2 truncate text-sm font-bold">{l?.title ?? '삭제된 글'}</p>
                <p className="mt-1 truncate text-[11px] text-dim">
                  {member?.nickname ?? '?'} → {host?.nickname ?? '?'} ·{' '}
                  {new Date(b.startAt).toLocaleString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {b.hours}시간
                  {b.pcbang ? ` · ${b.pcbang}` : ''} · 코드 {b.checkInCode}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                  {(
                    [
                      'CONFIRMED',
                      'CHECKED_IN',
                      'COMPLETED',
                      'CANCELLED',
                      'NO_SHOW',
                    ] as BookingStatus[]
                  )
                    .filter((x) => x !== b.status)
                    .map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => setBookingStatus(b.id, x)}
                        className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] transition hover:bg-white/14"
                      >
                        {BOOKING_STATUS[x].label}로
                      </button>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
