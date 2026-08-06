import { GAMES, type GameKey } from '@/lib/data'

export function GameBadge({ game, size = 'sm' }: { game: GameKey; size?: 'sm' | 'md' }) {
  const g = GAMES[game]
  const box = size === 'md' ? 'size-11 text-[11px]' : 'size-8 text-[9px]'

  return (
    <span
      title={g.name}
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-xl border font-bold tracking-tight`}
      style={{
        color: g.color,
        borderColor: `${g.color}44`,
        background: `${g.color}14`,
      }}
    >
      {g.short}
    </span>
  )
}
