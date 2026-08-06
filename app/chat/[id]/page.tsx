'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { currentUser, sendMessage, useStore } from '@/lib/store'

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const state = useStore()
  const me = currentUser(state)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const booking = state.bookings.find((b) => b.id === id)

  const messages = useMemo(
    () =>
      state.messages
        .filter((m) => m.bookingId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.messages, id],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (!me) {
    return (
      <>
        <ScreenHeader title="채팅" />
        <LoginRequired next={`/chat/${id}`} desc="대화는 로그인 후에 볼 수 있어요" />
      </>
    )
  }

  if (!booking) {
    return (
      <>
        <ScreenHeader title="채팅" />
        <main className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-sm text-muted">없는 대화방이에요</p>
        </main>
      </>
    )
  }

  const isHost = booking.hostId === me.id
  const other = state.users.find((u) => u.id === (isHost ? booking.memberId : booking.hostId))
  const listing = state.listings.find((l) => l.id === booking.listingId)

  return (
    <>
      <ScreenHeader title={other?.nickname ?? '대화'} />

      <main className="flex flex-1 flex-col gap-3 px-5 pt-1">
        <div className="glass rounded-2xl px-4 py-3">
          <p className="truncate text-xs font-bold">{listing?.title ?? '삭제된 글'}</p>
          <p className="mt-0.5 text-[11px] text-dim">
            개인 연락처·계좌를 주고받지 않도록 앱 안에서 대화해주세요
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 pb-4">
          {messages.map((m) => {
            const mine = m.senderId === me.id
            const sender = state.users.find((u) => u.id === m.senderId)
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}
              >
                {!mine && sender && (
                  <UserArt user={sender} className="size-7 shrink-0 rounded-full" sizes="28px" />
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    mine ? 'brand-gradient rounded-br-sm' : 'rounded-bl-sm bg-white/8'
                  }`}
                >
                  {m.body}
                </div>
                <span className="shrink-0 pb-1 text-[10px] text-dim">
                  {new Date(m.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 md:sticky md:bottom-6">
        <div className="mx-auto max-w-md px-5 md:max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(booking.id, me.id, draft)
              setDraft('')
            }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0d0d15]/90 py-2 pr-2 pl-4 backdrop-blur-xl"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="메시지 보내기"
              className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="보내기"
              className="brand-gradient grid size-9 shrink-0 place-items-center rounded-full transition disabled:opacity-30"
            >
              <Icon name="send" className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
