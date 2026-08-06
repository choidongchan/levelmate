'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PromiseBadge, PromiseDetail } from '@/components/badges'
import { GameBadge } from '@/components/game-badge'
import { Icon } from '@/components/icon'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { ratingAvg } from '@/lib/promise-score'
import { currentUser, useStore } from '@/lib/store'
import { GAMES, LISTING_KINDS, MEET_MODES } from '@/lib/types'

/** 시안의 '메이트 상세' 화면 */
export default function MateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const state = useStore()
  const me = currentUser(state)

  const user = state.users.find((u) => u.id === id)
  const listings = state.listings
    .filter((l) => l.userId === id && l.active)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const main = listings[0]

  if (!user) {
    return (
      <>
        <ScreenHeader title="메이트 상세" />
        <main className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-sm text-muted">없는 사용자예요</p>
        </main>
      </>
    )
  }

  const rating = ratingAvg(user)
  const isMe = me?.id === user.id

  return (
    <>
      <ScreenHeader title="메이트 상세" />

      <main className="flex flex-col gap-5 px-4 pt-4">
        <UserArt
          user={user}
          className="h-72 w-full rounded-3xl"
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />

        <section>
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <span className="online-dot size-1.5 rounded-full bg-online" />
            <span className="text-online">온라인</span>
          </span>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">{user.nickname}</h1>
            <span className="inline-flex items-center gap-1 text-sm">
              <Icon name="star" className="size-3.5 text-star" />
              <span className="font-semibold">{rating?.toFixed(1) ?? '신규'}</span>
              {user.reviewCount > 0 && (
                <span className="text-dim">({user.reviewCount})</span>
              )}
            </span>
          </div>
          {main && (
            <p className="mt-1 text-sm text-muted">
              {GAMES[main.mainGame].short} · {main.tier}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {user.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-online/15 px-2.5 py-1 text-[11px] font-bold text-online">
                <Icon name="shield" className="size-3" />
                본인 인증
              </span>
            )}
            <PromiseBadge user={user} size="md" />
          </div>
          {user.intro && <p className="mt-3 text-sm text-dim">{user.intro}</p>}
        </section>

        {main && (
          <dl className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">
            <Row icon="clock" label="가능 시간">
              {main.availableFrom} ~ {main.availableTo}
            </Row>

            <Row icon="gamepad" label="주요 게임">
              <div className="flex flex-wrap gap-2">
                {main.games.map((g) => (
                  <GameBadge key={g} game={g} size="md" />
                ))}
              </div>
            </Row>

            <Row icon={MEET_MODES[main.meetMode].icon} label="진행 방식">
              {MEET_MODES[main.meetMode].label}
              {main.pcbang && <span className="mt-1 block text-xs text-dim">{main.pcbang}</span>}
            </Row>

            <Row icon="location" label="지역">
              {main.region}
            </Row>

            <Row icon="info" label="소개">
              <p className="leading-relaxed whitespace-pre-line">{main.body}</p>
            </Row>
          </dl>
        )}

        <PromiseDetail user={user} />

        {listings.length > 1 && (
          <section>
            <h2 className="mb-2 text-base font-bold">이 메이트의 다른 글</h2>
            <div className="flex flex-col gap-2">
              {listings.slice(1).map((l) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 transition hover:bg-surface-2"
                >
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      color: LISTING_KINDS[l.kind].color,
                      background: `${LISTING_KINDS[l.kind].color}1a`,
                    }}
                  >
                    {LISTING_KINDS[l.kind].label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
                  <Icon name="chevronRight" className="size-4 shrink-0 text-dim" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {main && main.meetMode !== 'ONLINE' && (
          <p className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-xs text-muted">
            <Icon name="shield" className="size-4 shrink-0 text-brand-bright" />
            동행은 제휴 PC방에서만 진행됩니다.
          </p>
        )}
      </main>

      {/* 예약 바 */}
      {main && !isMe && (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-30 border-t border-line bg-ink/95 backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent">
          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 md:max-w-sm md:px-0">
            <div className="shrink-0">
              <p className="text-lg leading-tight font-bold text-brand-bright">
                {main.pricePerHour === 0 ? '무료' : won(main.pricePerHour)}
              </p>
              <p className="text-[11px] text-dim">시간당</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/listings/${main.id}`)}
              className="flex-1 rounded-2xl bg-brand py-3.5 text-sm font-bold transition hover:bg-brand-bright active:scale-[0.99]"
            >
              예약하기
            </button>
          </div>
        </div>
      )}
      <div className="h-20 md:hidden" aria-hidden />
    </>
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
    <div className="flex gap-3">
      <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-brand-bright" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-dim">{label}</dt>
        <dd className="mt-1 text-sm">{children}</dd>
      </div>
    </div>
  )
}
