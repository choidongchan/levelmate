import { Icon } from './icon'

export function Rating({
  value,
  count,
  className = '',
}: {
  value: number
  count?: number
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon name="star" className="size-3.5 text-star" />
      <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-dim tabular-nums">({count})</span>}
    </span>
  )
}
