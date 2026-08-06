import Link from 'next/link'
import { GameBadge } from './game-badge'
import { Icon } from './icon'
import { MateArt } from './mate-art'
import { GAMES, type Mate } from '@/lib/data'
import { won } from '@/lib/format'

/** 검색 결과처럼 정보를 나란히 비교할 때 쓰는 가로형 카드. */
export function MateCard({ mate, index = 0 }: { mate: Mate; index?: number }) {
  return (
    <Link
      href={`/mates/${mate.id}`}
      className="rise glass flex items-center gap-3.5 rounded-3xl p-3 transition hover:bg-white/8 active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative size-16 shrink-0">
        <MateArt hue={mate.hue} className="size-16 rounded-2xl" />
        {mate.online && (
          <span className="online-dot absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink bg-online" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{mate.nickname}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {GAMES[mate.mainGame].short} · {mate.tier}
        </p>
        <p className="mt-1 truncate text-xs text-dim">{mate.headline}</p>
        <div className="mt-2 flex gap-1">
          {mate.games.slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="flex items-center gap-0.5 text-xs">
          <Icon name="star" className="size-3 text-star" />
          <span className="font-semibold">{mate.rating.toFixed(1)}</span>
          <span className="text-dim">({mate.reviewCount})</span>
        </span>
        <span className="text-right text-[15px] leading-tight font-extrabold">
          {won(mate.pricePerHour)}
          <span className="block text-[10px] font-medium text-dim">시간당</span>
        </span>
      </div>
    </Link>
  )
}
