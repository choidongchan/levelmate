'use client'

import { useMemo, useState } from 'react'
import { Chip, Empty, PageTitle, SearchBox, StatCard, Tag } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import { won } from '@/lib/format'
import { useStore } from '@/lib/store'
import { BOOKING_STATUS, FEE_RATE, type BookingStatus } from '@/lib/types'

/**
 * 결제 현황.
 * PG(토스페이먼츠 등)를 붙이기 전이라, 예약에 적힌 금액을 결제 건으로 본다.
 * 연동 후에는 Payment 테이블을 그대로 읽어오면 된다.
 */
export default function AdminPaymentsPage() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<'ALL' | 'PAID' | 'REFUND'>('ALL')

  const paid = useMemo(
    () => s.bookings.filter((b) => b.amount > 0),
    [s.bookings],
  )

  const m = useMemo(() => {
    const done = paid.filter((b) => b.status === 'COMPLETED')
    const refunded = paid.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW')
    const pending = paid.filter((b) => ['REQUESTED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status))
    const gross = done.reduce((x, b) => x + b.amount, 0)
    return {
      gross,
      fee: Math.round(gross * FEE_RATE),
      payout: gross - Math.round(gross * FEE_RATE),
      refund: refunded.reduce((x, b) => x + b.amount, 0),
      holding: pending.reduce((x, b) => x + b.amount, 0),
      countDone: done.length,
      countRefund: refunded.length,
      countPending: pending.length,
    }
  }, [paid])

  const rows = useMemo(() => {
    const t = q.trim()
    return paid
      .filter((b) => {
        if (only === 'PAID') return b.status === 'COMPLETED'
        if (only === 'REFUND') return b.status === 'CANCELLED' || b.status === 'NO_SHOW'
        return true
      })
      .filter((b) => {
        if (!t) return true
        const l = s.listings.find((x) => x.id === b.listingId)
        const u = s.users.find((x) => x.id === b.memberId)
        return (l?.title.includes(t) ?? false) || (u?.nickname.includes(t) ?? false)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [paid, s.listings, s.users, q, only])

  return (
    <>
      <PageTitle title="결제 현황" desc="유료 예약의 결제·환불 흐름" />

      <p className="mb-4 flex gap-2 rounded-2xl border border-[#fbbf24]/25 bg-[#fbbf24]/8 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-[#fbbf24]" />
        <span>
          결제 대행사(PG)를 아직 붙이지 않아, 예약에 적힌 금액을 결제 건으로 보고 계산합니다.
          토스페이먼츠·포트원을 연동하면 실제 승인·취소 내역으로 바뀝니다.
        </span>
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="결제 완료" value={won(m.gross)} sub={`${m.countDone}건`} tone="brand" icon="won" />
        <StatCard label={`수수료 (${Math.round(FEE_RATE * 100)}%)`} value={won(m.fee)} tone="good" />
        <StatCard label="메이트 지급액" value={won(m.payout)} />
        <StatCard label="환불·취소" value={won(m.refund)} sub={`${m.countRefund}건`} tone="bad" />
      </div>

      <div className="mt-3">
        <StatCard
          label="진행 중 (예치)"
          value={won(m.holding)}
          sub={`${m.countPending}건 — 아직 완료되지 않은 예약`}
          tone="warn"
        />
      </div>

      <div className="mt-5 mb-3 flex flex-col gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="글 제목·결제자 닉네임으로 검색" />
        <div className="flex gap-2">
          <Chip active={only === 'ALL'} onClick={() => setOnly('ALL')}>전체</Chip>
          <Chip active={only === 'PAID'} onClick={() => setOnly('PAID')}>결제 완료</Chip>
          <Chip active={only === 'REFUND'} onClick={() => setOnly('REFUND')}>환불·취소</Chip>
        </div>
      </div>

      <p className="mb-2 px-1 text-xs text-dim">{rows.length}건</p>

      {rows.length === 0 ? (
        <Empty icon="won" text="결제 내역이 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[42rem] text-left text-xs">
            <thead className="border-b border-line text-dim">
              <tr>
                <Th>일시</Th>
                <Th>글</Th>
                <Th>결제자</Th>
                <Th>메이트</Th>
                <Th>상태</Th>
                <Th className="text-right">금액</Th>
                <Th className="text-right">수수료</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => {
                const l = s.listings.find((x) => x.id === b.listingId)
                const member = s.users.find((u) => u.id === b.memberId)
                const host = s.users.find((u) => u.id === b.hostId)
                const info = BOOKING_STATUS[b.status as BookingStatus]
                const isDone = b.status === 'COMPLETED'
                return (
                  <tr key={b.id}>
                    <Td className="whitespace-nowrap text-dim">
                      {new Date(b.createdAt).toLocaleDateString('ko-KR')}
                    </Td>
                    <Td className="max-w-[14rem] truncate">{l?.title ?? '삭제된 글'}</Td>
                    <Td>{member?.nickname ?? '?'}</Td>
                    <Td>{host?.nickname ?? '?'}</Td>
                    <Td>
                      <Tag color={info.color}>{info.label}</Tag>
                    </Td>
                    <Td className="text-right font-bold whitespace-nowrap">{won(b.amount)}</Td>
                    <Td className="text-right whitespace-nowrap text-dim">
                      {isDone ? won(Math.round(b.amount * FEE_RATE)) : '—'}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 font-medium ${className}`}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>
}
