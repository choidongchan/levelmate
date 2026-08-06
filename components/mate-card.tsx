import Link from 'next/link'
import { Avatar } from './avatar'
import { GameBadge } from './game-badge'
import { OnlineDot } from './online-dot'
import { Rating } from './stars'
import { GAMES, type Mate } from '@/lib/data'
import { won } from '@/lib/format'

export function MateCard({ mate }: { mate: Mate }) {
  return (
    <Link
      href={`/mates/${mate.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-3 transition hover:bg-surface-2 active:scale-[0.99]"
    >
      <Avatar nickname={mate.nickname} hue={mate.hue} className="size-14 shrink-0 text-lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{mate.nickname}</span>
          <OnlineDot online={mate.online} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {GAMES[mate.mainGame].short} · {mate.tier}
        </p>
        <p className="mt-1 truncate text-xs text-dim">{mate.headline}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Rating value={mate.rating} count={mate.reviewCount} className="text-xs" />
        <span className="text-sm font-bold text-brand-bright">
          {won(mate.pricePerHour)}
          <span className="text-[11px] font-medium text-dim">/시간</span>
        </span>
        <div className="flex gap-1">
          {mate.games.slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>
    </Link>
  )
}
