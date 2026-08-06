'use client'

import { useState } from 'react'
import { Empty, PageTitle, Panel, StatCard, Tag } from '@/components/admin-ui'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { generateSettlements, paySettlement, useStore } from '@/lib/store'
import { FEE_RATE } from '@/lib/types'

export default function AdminSettlementsPage() {
  const s = useStore()
  const [msg, setMsg] = useState('')

  const waiting = s.bookings.filter(
    (b) => b.status === 'COMPLETED' && !b.settled && b.amount > 0,
  )
  const waitingAmount = waiting.reduce((x, b) => x + b.amount, 0)
  const pending = s.settlements.filter((x) => x.status === 'PENDING')
  const paidTotal = s.settlements
    .filter((x) => x.status === 'PAID')
    .reduce((x, y) => x + y.net, 0)

  return (
    <>
      <PageTitle title="정산" desc="완료된 유료 예약을 메이트별로 묶어 지급" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="정산 대기 예약" value={`${waiting.length}건`} sub={won(waitingAmount)} tone="warn" />
        <StatCard label="지급 대기" value={`${pending.length}건`} sub={won(pending.reduce((x, y) => x + y.net, 0))} tone="brand" />
        <StatCard label="지급 완료" value={won(paidTotal)} tone="good" />
        <StatCard label="수수료율" value={`${Math.round(FEE_RATE * 100)}%`} />
      </div>

      <Panel
        title="정산 생성"
        action={
          <button
            type="button"
            disabled={waiting.length === 0}
            onClick={() => {
              const n = generateSettlements()
              setMsg(n > 0 ? `정산 ${n}건을 만들었습니다` : '정산할 건이 없습니다')
            }}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold transition hover:bg-brand-bright disabled:opacity-40"
          >
            정산 만들기
          </button>
        }
      >
        <p className="text-xs text-muted">
          완료된 유료 예약 <b className="text-white">{waiting.length}건</b>({won(waitingAmount)})이
          정산 대기 중입니다. 메이트별로 묶어서 정산서를 만듭니다.
        </p>
        {msg && <p className="mt-2 text-xs text-brand-bright">{msg}</p>}
      </Panel>

      <div className="mt-4">
        {s.settlements.length === 0 ? (
          <Empty icon="won" text="정산 내역이 없습니다" />
        ) : (
          <div className="grid gap-2.5 xl:grid-cols-2">
            {s.settlements.map((x) => {
              const host = s.users.find((u) => u.id === x.hostId)
              return (
                <div key={x.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center gap-2.5">
                    {host && <UserArt user={host} className="size-9 rounded-lg" sizes="36px" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {host?.nickname ?? '삭제된 회원'}
                      </p>
                      <p className="text-[10px] text-dim">
                        예약 {x.bookingIds.length}건 ·{' '}
                        {new Date(x.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <Tag color={x.status === 'PAID' ? '#34d399' : '#fbbf24'}>
                      {x.status === 'PAID' ? '지급 완료' : '지급 대기'}
                    </Tag>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Cell label="거래액" value={won(x.gross)} />
                    <Cell label={`수수료 ${Math.round((x.fee / x.gross) * 100)}%`} value={`-${won(x.fee)}`} />
                    <Cell label="지급액" value={won(x.net)} strong />
                  </dl>

                  {x.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => paySettlement(x.id)}
                      className="mt-3 w-full rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
                    >
                      지급 처리
                    </button>
                  ) : (
                    <p className="mt-3 text-center text-[10px] text-dim">
                      {x.paidAt && new Date(x.paidAt).toLocaleString('ko-KR')} 지급됨
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 py-2.5">
      <dd className={`text-[13px] font-black ${strong ? 'text-brand-bright' : ''}`}>{value}</dd>
      <dt className="mt-0.5 text-[10px] text-dim">{label}</dt>
    </div>
  )
}
