import { GAMES, type GameKey } from '@/lib/data'

export function GameBadge({ game, size = 'sm' }: { game: GameKey; size?: 'sm' | 'md' }) {
  const g = GAMES[game]
  const box = size === 'md' ? 'h-9 px-3.5 text-xs' : 'h-6 px-2 text-[10px]'

  return (
    <span
      title={g.name}
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full border font-bold tracking-tight`}
      style={{
        color: g.color,
        borderColor: `${g.color}3d`,
        background: `${g.color}14`,
      }}
    >
      {g.short}
    </span>
  )
}
