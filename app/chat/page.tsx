'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { currentUser, useStore } from '@/lib/store'

export default function ChatListPage() {
  const state = useStore()
  const me = currentUser(state)

  const rooms = useMemo(() => {
    if (!me) return []
    return state.bookings
      .filter((b) => b.memberId === me.id || b.hostId === me.id)
      .map((b) => {
        const msgs = state.messages
          .filter((m) => m.bookingId === b.id)
          .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
        return { booking: b, last: msgs.at(-1) }
      })
      .sort((a, b) =>
        (b.last?.createdAt ?? b.booking.createdAt).localeCompare(
          a.last?.createdAt ?? a.booking.createdAt,
        ),
      )
  }, [state.bookings, state.messages, me])

  if (!me) {
    return (
      <>
        <ScreenHeader title="채팅" back={false} />
        <LoginRequired next="/chat" desc="대화는 로그인 후에 볼 수 있어요" />
      </>
    )
  }

  return (
    <>
      <ScreenHeader title="채팅" back={false} />

      <main className="flex flex-col gap-2 px-5 pt-1">
        <p className="px-1 pb-1 text-[11px] text-dim">
          연락처를 주고받지 않아도 되도록 예약별로 대화방이 열립니다
        </p>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span className="glass grid size-14 place-items-center rounded-2xl">
              <Icon name="chat" className="size-6 text-dim" />
            </span>
            <p className="mt-1 text-sm font-semibold">아직 대화가 없어요</p>
            <p className="text-xs text-dim">예약을 신청하면 대화방이 만들어집니다</p>
          </div>
        ) : (
          rooms.map(({ booking, last }) => {
            const isHost = booking.hostId === me.id
            const other = state.users.find(
              (u) => u.id === (isHost ? booking.memberId : booking.hostId),
            )
            const listing = state.listings.find((l) => l.id === booking.listingId)
            if (!other) return null

            return (
              <Link
                key={booking.id}
                href={`/chat/${booking.id}`}
                className="glass flex items-center gap-3 rounded-3xl p-3.5 transition hover:bg-white/8"
              >
                <UserArt user={other} className="size-12 shrink-0 rounded-2xl" sizes="48px" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{other.nickname}</p>
                  <p className="mt-0.5 truncate text-[11px] text-dim">
                    {listing?.title ?? '삭제된 글'}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {last?.body ?? '대화를 시작해보세요'}
                  </p>
                </div>
                <Icon name="chevronRight" className="size-4 shrink-0 text-dim" />
              </Link>
            )
          })
        )}
      </main>
    </>
  )
}
