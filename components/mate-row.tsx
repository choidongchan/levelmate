import Link from 'next/link'
import { GameBadge } from './game-badge'
import { Icon } from './icon'
import { UserArt } from './user-art'
import { won } from '@/lib/format'
import { ratingAvg } from '@/lib/promise-score'
import { GAMES, type Listing, type User } from '@/lib/types'

/** 시안의 '추천 메이트' 행. 사진 · 닉네임 · 게임/티어 · 한 줄 소개 · 평점 · 가격 · 게임 배지 */
export function MateRow({
  user,
  listing,
  index = 0,
}: {
  user: User
  listing: Listing
  index?: number
}) {
  const rating = ratingAvg(user)

  return (
    <Link
      href={`/users/${user.id}`}
      className="rise flex items-center gap-3 rounded-2xl bg-surface p-3 transition hover:bg-surface-2 active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <UserArt
        user={user}
        className="size-14 shrink-0 rounded-2xl"
        sizes="56px"
        priority={index < 3}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{user.nickname}</span>
          <span className="flex shrink-0 items-center gap-1 text-[11px]">
            <span className="online-dot size-1.5 rounded-full bg-online" />
            <span className="text-online">온라인</span>
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {GAMES[listing.mainGame].short} · {listing.tier}
        </p>
        <p className="mt-1 truncate text-xs text-dim">{listing.title}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs">
          <Icon name="star" className="size-3.5 text-star" />
          <span className="font-semibold tabular-nums">{rating?.toFixed(1) ?? '신규'}</span>
          {user.reviewCount > 0 && (
            <span className="text-dim tabular-nums">({user.reviewCount})</span>
          )}
        </span>
        <span className="text-sm font-bold text-brand-bright">
          {listing.pricePerHour === 0 ? (
            <span className="text-online">무료</span>
          ) : (
            <>
              {won(listing.pricePerHour)}
              <span className="text-[11px] font-medium text-dim">/시간</span>
            </>
          )}
        </span>
        <div className="flex gap-1">
          {listing.games.slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>
    </Link>
  )
}
