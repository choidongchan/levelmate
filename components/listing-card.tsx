import Link from 'next/link'
import { KindBadge, ModeBadge, PromiseBadge } from './badges'
import { GameBadge } from './game-badge'
import { Icon } from './icon'
import { UserArt } from './user-art'
import { won } from '@/lib/format'
import { GAMES, type Listing, type User } from '@/lib/types'

export function ListingCard({
  listing,
  author,
  index = 0,
}: {
  listing: Listing
  author: User
  index?: number
}) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="rise glass block rounded-3xl p-4 transition hover:bg-white/8 active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-center gap-2">
        <KindBadge kind={listing.kind} />
        <ModeBadge mode={listing.meetMode} />
        <span className="ml-auto shrink-0 text-[15px] font-extrabold">
          {listing.pricePerHour === 0 ? (
            <span className="text-online">무료</span>
          ) : (
            <>
              {won(listing.pricePerHour)}
              <span className="text-[10px] font-medium text-dim"> /시간</span>
            </>
          )}
        </span>
      </div>

      <p className="mt-2.5 leading-snug font-bold">{listing.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-dim">
        <Icon name="location" className="size-3" />
        {listing.region}
        <span className="text-white/20">·</span>
        {GAMES[listing.mainGame].name} {listing.tier}
        <span className="text-white/20">·</span>
        {listing.availableFrom}~{listing.availableTo}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
        <UserArt user={author} className="size-7 rounded-full" sizes="28px" />
        <span className="truncate text-xs font-medium">{author.nickname}</span>
        <PromiseBadge user={author} />
        <div className="ml-auto flex gap-1">
          {listing.games.slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>
    </Link>
  )
}
