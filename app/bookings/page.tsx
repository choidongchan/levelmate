'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { currentUser, setBookingStatus, useStore } from '@/lib/store'
import { BOOKING_STATUS, MEET_MODES, type Booking, type BookingStatus } from '@/lib/types'

const TABS = [
  { key: 'active', label: '진행 중' },
  { key: 'done', label: '지난 예약' },
] as const

export default function BookingsPage() {
  const router = useRouter()
  const state = useStore()
  const me = currentUser(state)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('active')

  const mine = useMemo(() => {
    if (!me) return []
    return state.bookings
      .filter((b) => b.memberId === me.id || b.hostId === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state.bookings, me])

  const shown = mine.filter((b) =>
    tab === 'active'
      ? ['REQUESTED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)
      : ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status),
  )

  if (!me) {
    return (
      <>
        <ScreenHeader title="예약" back={false} />
        <LoginRequired next="/bookings" desc="예약 내역은 로그인 후에 볼 수 있어요" />
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="예약" back={false} />

      <main className="flex flex-col gap-4 px-5 pt-1">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
                tab === t.key ? 'bg-white text-ink' : 'bg-white/5 text-muted hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span className="glass grid size-14 place-items-center rounded-2xl">
              <Icon name="calendar" className="size-6 text-dim" />
            </span>
            <p className="mt-1 text-sm font-semibold">
              {tab === 'active' ? '진행 중인 예약이 없어요' : '지난 예약이 없어요'}
            </p>
            <Link href="/" className="mt-1 text-xs text-brand-bright">
              글 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {shown.map((b) => (
              <BookingRow key={b.id} booking={b} meId={me.id} onOpenChat={() => router.push(`/chat/${b.id}`)} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function BookingRow({
  booking,
  meId,
  onOpenChat,
}: {
  booking: Booking
  meId: string
  onOpenChat: () => void
}) {
  const state = useStore()
  const listing = state.listings.find((l) => l.id === booking.listingId)
  const isHost = booking.hostId === meId
  const other = state.users.find((u) => u.id === (isHost ? booking.memberId : booking.hostId))
  const status = BOOKING_STATUS[booking.status]

  if (!other) return null

  const actions: { label: string; to: BookingStatus; tone?: 'danger' }[] = []
  if (booking.status === 'REQUESTED' && isHost) {
    actions.push({ label: '수락', to: 'CONFIRMED' })
    actions.push({ label: '거절', to: 'CANCELLED', tone: 'danger' })
  }
  if (booking.status === 'CONFIRMED') {
    actions.push({ label: '체크인', to: 'CHECKED_IN' })
    actions.push({ label: '취소', to: 'CANCELLED', tone: 'danger' })
  }
  if (booking.status === 'CHECKED_IN') {
    actions.push({ label: '완료 처리', to: 'COMPLETED' })
    if (!isHost) actions.push({ label: '상대 노쇼', to: 'NO_SHOW', tone: 'danger' })
  }

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ color: status.color, background: `${status.color}1f` }}
        >
          {status.label}
        </span>
        <span className="text-[11px] text-dim">{isHost ? '받은 신청' : '내 신청'}</span>
        <span className="ml-auto text-sm font-extrabold">
          {booking.amount === 0 ? <span className="text-online">무료</span> : won(booking.amount)}
        </span>
      </div>

      <Link href={`/listings/${booking.listingId}`} className="mt-2.5 block">
        <p className="truncate font-bold">{listing?.title ?? '삭제된 글'}</p>
      </Link>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-dim">
        <Icon name="clock" className="size-3" />
        {formatWhen(booking.startAt)} · {booking.hours}시간
        <span className="text-white/20">·</span>
        {MEET_MODES[booking.meetMode].short}
        {booking.pcbang && (
          <>
            <span className="text-white/20">·</span>
            {booking.pcbang}
          </>
        )}
      </div>

      {booking.status === 'CONFIRMED' && booking.meetMode === 'OFFLINE' && (
        <p className="mt-2.5 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-[11px] text-muted">
          <Icon name="qr" className="size-4 shrink-0 text-brand-bright" />
          PC방 체크인 코드 <b className="text-white">{booking.checkInCode}</b>
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
        <UserArt user={other} className="size-7 rounded-full" sizes="28px" />
        <span className="truncate text-xs font-medium">{other.nickname}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenChat}
            className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
          >
            채팅
          </button>
          {actions.map((a) => (
            <button
              key={a.to + a.label}
              type="button"
              onClick={() => setBookingStatus(booking.id, a.to)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                a.tone === 'danger'
                  ? 'bg-[#f43f5e]/15 text-[#f43f5e] hover:bg-[#f43f5e]/25'
                  : 'brand-gradient'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '일정 미정'
  return d.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
