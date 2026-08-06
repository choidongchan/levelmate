'use client'

import { useParams } from 'next/navigation'
import { PromiseDetail } from '@/components/badges'
import { Icon } from '@/components/icon'
import { ListingCard } from '@/components/listing-card'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { ratingAvg } from '@/lib/promise-score'
import { useStore } from '@/lib/store'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const state = useStore()
  const user = state.users.find((u) => u.id === id)

  if (!user) {
    return (
      <>
        <ScreenHeader title="프로필" />
        <main className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-sm text-muted">없는 사용자예요</p>
        </main>
      </>
    )
  }

  const listings = state.listings.filter((l) => l.userId === user.id && l.active)
  const rating = ratingAvg(user)

  return (
    <>
      <ScreenHeader title="프로필" />

      <main className="flex flex-col gap-4 px-5 pt-1">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <UserArt user={user} className="size-16 shrink-0 rounded-3xl" sizes="64px" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-lg font-black tracking-tight">{user.nickname}</span>
                {user.verified && <Icon name="shield" className="size-4 shrink-0 text-online" />}
              </div>
              <p className="mt-0.5 text-xs text-dim">{user.region}</p>
              {rating !== null && (
                <p className="mt-1 flex items-center gap-1 text-xs">
                  <Icon name="star" className="size-3 text-star" />
                  <span className="font-bold">{rating}</span>
                  <span className="text-dim">({user.reviewCount})</span>
                </p>
              )}
            </div>
          </div>
          {user.intro && <p className="mt-3 text-xs leading-relaxed text-muted">{user.intro}</p>}
        </section>

        <PromiseDetail user={user} />

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-bold">올린 글 {listings.length}</h2>
          <div className="flex flex-col gap-2.5">
            {listings.map((l, i) => (
              <ListingCard key={l.id} listing={l} author={user} index={i} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
