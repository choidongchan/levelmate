'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PromiseBadge } from '@/components/badges'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import {
  banUser,
  currentUser,
  deleteUser,
  generateSettlements,
  paySettlement,
  useStore,
  verifyUser,
} from '@/lib/store'
import { FEE_RATE, type User } from '@/lib/types'

const TABS = [
  { key: 'overview', label: '현황' },
  { key: 'users', label: '회원 관리' },
  { key: 'settlements', label: '정산' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function AdminPage() {
  const state = useStore()
  const me = currentUser(state)
  const [tab, setTab] = useState<TabKey>('overview')

  if (!me) {
    return (
      <>
        <ScreenHeader title="관리자" />
        <LoginRequired next="/admin" desc="관리자 계정으로 로그인해주세요" />
      </>
    )
  }

  if (me.role !== 'ADMIN') {
    return (
      <>
        <ScreenHeader title="관리자" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
          <span className="glass grid size-16 place-items-center rounded-3xl">
            <Icon name="ban" className="size-7 text-[#f43f5e]" />
          </span>
          <p className="mt-1 text-[15px] font-bold">접근 권한이 없어요</p>
          <p className="text-xs leading-relaxed text-dim">
            관리자 계정으로 로그인하면 이 페이지를 볼 수 있습니다.
            <br />
            (예시 데이터의 관리자 번호: 010-0000-0000)
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="관리자" />

      <main className="flex flex-col gap-4 px-5 pt-1">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                tab === t.key ? 'bg-white text-ink' : 'bg-white/5 text-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'users' && <Users meId={me.id} />}
        {tab === 'settlements' && <Settlements />}
      </main>
    </>
  )
}

function Overview() {
  const state = useStore()

  const stats = useMemo(() => {
    const paid = state.bookings.filter((b) => b.status === 'COMPLETED' && b.amount > 0)
    const gross = paid.reduce((s, b) => s + b.amount, 0)
    return {
      users: state.users.length,
      unverified: state.users.filter((u) => !u.verified).length,
      listings: state.listings.filter((l) => l.active).length,
      bookings: state.bookings.length,
      pending: state.bookings.filter((b) => b.status === 'REQUESTED').length,
      gross,
      fee: Math.round(gross * FEE_RATE),
      unsettled: state.bookings.filter(
        (b) => b.status === 'COMPLETED' && !b.settled && b.amount > 0,
      ).length,
    }
  }, [state])

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="전체 회원" value={`${stats.users}명`} sub={`미인증 ${stats.unverified}`} />
      <Stat label="활성 글" value={`${stats.listings}개`} />
      <Stat label="전체 예약" value={`${stats.bookings}건`} sub={`수락 대기 ${stats.pending}`} />
      <Stat label="정산 대기" value={`${stats.unsettled}건`} />
      <Stat label="누적 거래액" value={won(stats.gross)} highlight />
      <Stat label={`플랫폼 수수료 (${Math.round(FEE_RATE * 100)}%)`} value={won(stats.fee)} />
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className="glass rounded-3xl px-4 py-3.5">
      <p className="text-[11px] text-dim">{label}</p>
      <p className={`mt-1 text-lg font-black tracking-tight ${highlight ? 'gradient-text' : ''}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-dim">{sub}</p>}
    </div>
  )
}

function Users({ meId }: { meId: string }) {
  const state = useStore()
  const [q, setQ] = useState('')

  const users = state.users.filter(
    (u) => u.nickname.includes(q.trim()) || u.phone.includes(q.trim()),
  )

  return (
    <div className="flex flex-col gap-2.5">
      <div className="glass flex items-center gap-2.5 rounded-full px-4 py-3">
        <Icon name="search" className="size-4 shrink-0 text-dim" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="닉네임 또는 번호로 검색"
          className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
        />
      </div>

      <p className="px-1 text-xs text-dim">{users.length}명</p>

      <div className="grid gap-2.5 md:grid-cols-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === meId} />
        ))}
      </div>
    </div>
  )
}

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <UserArt user={user} className="size-11 shrink-0 rounded-2xl" sizes="44px" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={`/users/${user.id}`} className="truncate text-sm font-bold hover:underline">
              {user.nickname}
            </Link>
            {user.role === 'ADMIN' && (
              <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-bright">
                운영자
              </span>
            )}
            {user.bannedAt && (
              <span className="rounded-full bg-[#f43f5e]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#f43f5e]">
                정지
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-dim">
            {user.phone} · {user.region}
          </p>
        </div>
        <PromiseBadge user={user} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/6 pt-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            user.verified ? 'bg-online/20 text-online' : 'bg-white/8 text-dim'
          }`}
        >
          {user.verified ? '본인인증 완료' : '미인증'}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => verifyUser(user.id, !user.verified)}
            className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
          >
            {user.verified ? '인증 해제' : '인증 처리'}
          </button>

          {!isSelf && (
            <>
              <button
                type="button"
                onClick={() => banUser(user.id, !user.bannedAt)}
                className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
              >
                {user.bannedAt ? '정지 해제' : '정지'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `${user.nickname} 회원을 삭제할까요?\n올린 글·예약·대화도 함께 지워집니다.`,
                    )
                  ) {
                    deleteUser(user.id)
                  }
                }}
                aria-label="회원 삭제"
                className="grid size-7 place-items-center rounded-full bg-[#f43f5e]/15 text-[#f43f5e] transition hover:bg-[#f43f5e]/25"
              >
                <Icon name="trash" className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Settlements() {
  const state = useStore()
  const [msg, setMsg] = useState('')

  const pendingCount = state.bookings.filter(
    (b) => b.status === 'COMPLETED' && !b.settled && b.amount > 0,
  ).length

  return (
    <div className="flex flex-col gap-3">
      <div className="glass flex items-center gap-3 rounded-3xl p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">정산 생성</p>
          <p className="mt-0.5 text-[11px] text-dim">
            완료된 유료 예약 {pendingCount}건이 정산 대기 중이에요
          </p>
        </div>
        <button
          type="button"
          disabled={pendingCount === 0}
          onClick={() => {
            const n = generateSettlements()
            setMsg(n > 0 ? `정산 ${n}건을 만들었어요` : '정산할 건이 없어요')
          }}
          className="cta shrink-0 rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-40"
        >
          정산 만들기
        </button>
      </div>

      {msg && <p className="px-1 text-xs text-brand-bright">{msg}</p>}

      {state.settlements.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="glass grid size-14 place-items-center rounded-2xl">
            <Icon name="won" className="size-6 text-dim" />
          </span>
          <p className="mt-1 text-sm font-semibold">정산 내역이 없어요</p>
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {state.settlements.map((s) => {
            const host = state.users.find((u) => u.id === s.hostId)
            return (
              <div key={s.id} className="glass rounded-3xl p-4">
                <div className="flex items-center gap-2">
                  {host && <UserArt user={host} className="size-8 rounded-full" sizes="32px" />}
                  <span className="truncate text-sm font-bold">{host?.nickname ?? '삭제된 회원'}</span>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      s.status === 'PAID'
                        ? 'bg-online/20 text-online'
                        : 'bg-[#fbbf24]/20 text-[#fbbf24]'
                    }`}
                  >
                    {s.status === 'PAID' ? '지급 완료' : '지급 대기'}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Cell label="거래액" value={won(s.gross)} />
                  <Cell label={`수수료 ${Math.round(FEE_RATE * 100)}%`} value={`-${won(s.fee)}`} />
                  <Cell label="지급액" value={won(s.net)} strong />
                </dl>

                <p className="mt-2 text-[10px] text-dim">
                  예약 {s.bookingIds.length}건 · {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                </p>

                {s.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => paySettlement(s.id)}
                    className="cta mt-3 w-full rounded-full py-2.5 text-xs font-black"
                  >
                    지급 처리
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/4 py-2.5">
      <dd className={`text-[13px] font-black ${strong ? 'text-brand-bright' : ''}`}>{value}</dd>
      <dt className="mt-0.5 text-[10px] text-dim">{label}</dt>
    </div>
  )
}
