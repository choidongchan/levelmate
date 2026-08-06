'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { KindBadge, ModeBadge, PromiseDetail } from '@/components/badges'
import { GameBadge } from '@/components/game-badge'
import { Icon } from '@/components/icon'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { ratingAvg } from '@/lib/promise-score'
import { createBooking, currentUser, deleteListing, useStore } from '@/lib/store'
import { GAMES, LISTING_KINDS, MEET_MODES, type MeetMode } from '@/lib/types'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const state = useStore()
  const me = currentUser(state)

  const [booking, setBooking] = useState(false)

  const listing = state.listings.find((l) => l.id === id)
  const author = listing ? state.users.find((u) => u.id === listing.userId) : undefined

  if (!listing || !author) {
    return (
      <>
        <ScreenHeader title="글" />
        <main className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-sm text-muted">삭제되었거나 없는 글이에요</p>
          <Link href="/" className="mt-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-bold">
            홈으로
          </Link>
        </main>
      </>
    )
  }

  const kind = LISTING_KINDS[listing.kind]
  const isMine = me?.id === author.id
  const rating = ratingAvg(author)

  return (
    <>
      <ScreenHeader
        title="상세"
        action={
          isMine ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('이 글을 삭제할까요?')) {
                  deleteListing(listing.id)
                  router.replace('/')
                }
              }}
              className="grid size-9 place-items-center rounded-full text-dim transition hover:bg-white/8 hover:text-[#f43f5e]"
              aria-label="글 삭제"
            >
              <Icon name="trash" className="size-4" />
            </button>
          ) : null
        }
      />

      <main className="flex flex-col gap-5 px-5 pt-2">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={listing.kind} size="md" />
            <ModeBadge mode={listing.meetMode} />
          </div>
          <h1 className="mt-3 text-[22px] leading-snug font-black tracking-tight">
            {listing.title}
          </h1>
          <p className="mt-2 text-xs text-dim">{kind.desc}</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="참가비"
            value={listing.pricePerHour === 0 ? '무료' : `${won(listing.pricePerHour)}/시간`}
            highlight={listing.pricePerHour > 0}
          />
          <Stat label="가능 시간" value={`${listing.availableFrom}~${listing.availableTo}`} />
        </div>

        <dl className="glass flex flex-col gap-5 rounded-3xl p-5">
          <Row icon="info" label="내용">
            <p className="leading-relaxed whitespace-pre-line text-muted">{listing.body}</p>
          </Row>

          <Row icon="gamepad" label="게임">
            <div className="flex flex-wrap items-center gap-2">
              {listing.games.map((g) => (
                <GameBadge key={g} game={g} size="md" />
              ))}
              <span className="text-xs text-dim">
                {GAMES[listing.mainGame].name} · {listing.tier}
              </span>
            </div>
          </Row>

          <Row icon="location" label="지역">
            {listing.region}
            {listing.pcbang && (
              <span className="mt-1 block text-xs text-dim">{listing.pcbang}</span>
            )}
          </Row>

          <Row icon={MEET_MODES[listing.meetMode].icon} label="진행 방식">
            {MEET_MODES[listing.meetMode].label}
          </Row>
        </dl>

        {/* 작성자 */}
        <section className="glass rounded-3xl p-5">
          <Link href={`/users/${author.id}`} className="flex items-center gap-3">
            <UserArt user={author} className="size-12 rounded-2xl" sizes="48px" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold">{author.nickname}</span>
                {author.verified && (
                  <Icon name="shield" className="size-3.5 shrink-0 text-online" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-dim">
                {author.region}
                {rating !== null && ` · 후기 ${rating} (${author.reviewCount})`}
              </p>
            </div>
            <Icon name="chevronRight" className="size-4 text-dim" />
          </Link>
          {author.intro && <p className="mt-3 text-xs leading-relaxed text-muted">{author.intro}</p>}
        </section>

        <PromiseDetail user={author} />

        {listing.meetMode !== 'ONLINE' && (
          <p className="flex items-center gap-2.5 rounded-3xl border border-online/20 bg-online/8 px-4 py-3.5 text-xs text-muted">
            <Icon name="shield" className="size-4 shrink-0 text-online" />
            만나서 하는 동행은 제휴 PC방에서만 진행됩니다.
          </p>
        )}
      </main>

      {!isMine && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 md:static md:mt-4">
          <div className="mx-auto max-w-md px-5 md:mx-0 md:max-w-sm">
            <button
              type="button"
              onClick={() => {
                if (!me) {
                  router.push(`/login?next=/listings/${listing.id}`)
                  return
                }
                setBooking(true)
              }}
              className="brand-gradient pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-bold shadow-[0_10px_30px_-6px] shadow-brand/70 transition active:scale-[0.99]"
            >
              {listing.kind === 'LEARN' ? '알려주겠다고 하기' : '신청하기'}
              <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
        </div>
      )}
      <div className="h-8 md:hidden" aria-hidden />

      {booking && me && (
        <BookingSheet
          onClose={() => setBooking(false)}
          onSubmit={(input) => {
            createBooking({
              listingId: listing.id,
              memberId: me.id,
              hostId: author.id,
              startAt: input.startAt,
              hours: input.hours,
              amount: listing.pricePerHour * input.hours,
              meetMode: input.meetMode,
              pcbang: input.meetMode === 'OFFLINE' ? listing.pcbang : null,
            })
            setBooking(false)
            router.push('/bookings')
          }}
          defaultMode={listing.meetMode === 'BOTH' ? 'ONLINE' : listing.meetMode}
          allowBoth={listing.meetMode === 'BOTH'}
          pricePerHour={listing.pricePerHour}
          pcbang={listing.pcbang}
        />
      )}
    </>
  )
}

function BookingSheet({
  onClose,
  onSubmit,
  defaultMode,
  allowBoth,
  pricePerHour,
  pcbang,
}: {
  onClose: () => void
  onSubmit: (input: { startAt: string; hours: number; meetMode: MeetMode }) => void
  defaultMode: MeetMode
  allowBoth: boolean
  pricePerHour: number
  pcbang: string | null
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('20:00')
  const [hours, setHours] = useState(2)
  const [meetMode, setMeetMode] = useState<MeetMode>(defaultMode)

  const total = pricePerHour * hours

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-[2rem] border-t border-white/10 bg-[#0d0d15] px-5 pt-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
        <h2 className="text-lg font-black tracking-tight">언제 만날까요?</h2>

        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="glass rounded-2xl px-4 py-3">
              <span className="block text-[11px] text-dim">날짜</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none [color-scheme:dark]"
              />
            </label>
            <label className="glass rounded-2xl px-4 py-3">
              <span className="block text-[11px] text-dim">시작 시간</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none [color-scheme:dark]"
              />
            </label>
          </div>

          <div className="glass rounded-2xl px-4 py-3">
            <span className="block text-[11px] text-dim">진행 시간</span>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                    hours === h ? 'bg-white text-ink' : 'bg-white/6 text-muted'
                  }`}
                >
                  {h}시간
                </button>
              ))}
            </div>
          </div>

          {allowBoth && (
            <div className="glass rounded-2xl px-4 py-3">
              <span className="block text-[11px] text-dim">방식</span>
              <div className="mt-2 flex gap-2">
                {(['ONLINE', 'OFFLINE'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMeetMode(m)}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                      meetMode === m ? 'bg-white text-ink' : 'bg-white/6 text-muted'
                    }`}
                  >
                    {MEET_MODES[m].short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {meetMode === 'OFFLINE' && pcbang && (
            <p className="flex items-center gap-2 rounded-2xl bg-white/4 px-4 py-3 text-xs text-muted">
              <Icon name="monitor" className="size-4 shrink-0 text-brand-bright" />
              {pcbang}
            </p>
          )}

          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs text-dim">총 금액</span>
            <span className="text-xl font-black tracking-tight">
              {total === 0 ? <span className="text-online">무료</span> : won(total)}
            </span>
          </div>

          <button
            type="button"
            disabled={!date}
            onClick={() =>
              onSubmit({ startAt: new Date(`${date}T${time}`).toISOString(), hours, meetMode })
            }
            className="brand-gradient rounded-2xl py-4 text-sm font-bold transition active:scale-[0.99] disabled:opacity-40"
          >
            신청 보내기
          </button>
          <p className="text-center text-[11px] text-dim">
            상대가 수락하면 예약이 확정됩니다
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="glass rounded-3xl px-4 py-3.5">
      <p className="text-[11px] text-dim">{label}</p>
      <p className={`mt-1 text-lg font-black tracking-tight ${highlight ? 'gradient-text' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: 'clock' | 'gamepad' | 'monitor' | 'info' | 'location' | 'headset' | 'group'
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5">
      <Icon name={icon} className="mt-0.5 size-[18px] shrink-0 text-brand-bright" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-dim">{label}</dt>
        <dd className="mt-1.5 text-sm">{children}</dd>
      </div>
    </div>
  )
}
