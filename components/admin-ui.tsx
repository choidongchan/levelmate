import { Icon, type IconName } from './icon'

export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-black tracking-tight">{title}</h1>
      {desc && <p className="mt-1 text-xs text-dim">{desc}</p>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string
  value: string
  sub?: string
  icon?: IconName
  tone?: 'brand' | 'good' | 'warn' | 'bad'
}) {
  const color =
    tone === 'brand' ? '#a855f7'
    : tone === 'good' ? '#34d399'
    : tone === 'warn' ? '#fbbf24'
    : tone === 'bad' ? '#f43f5e'
    : undefined

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5">
        {icon && <Icon name={icon} className="size-3.5 text-dim" />}
        <p className="text-[11px] text-dim">{label}</p>
      </div>
      <p className="mt-1.5 text-xl font-black tracking-tight" style={color ? { color } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-dim">{sub}</p>}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
      <Icon name="search" className="size-4 shrink-0 text-dim" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="지우기"
          className="text-dim transition hover:text-muted"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? 'border-brand bg-brand/15 font-bold text-brand-bright'
          : 'border-line bg-surface text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

export function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ color, background: `${color}1f` }}
    >
      {children}
    </span>
  )
}

export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <Icon name={icon} className="size-7 text-dim" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  )
}

/** 순위 목록에 쓰는 막대 */
export function BarRow({
  label,
  value,
  max,
  suffix = '',
  rank,
}: {
  label: string
  value: number
  max: number
  suffix?: string
  rank?: number
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <li className="flex items-center gap-3 py-2">
      {rank !== undefined && (
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-black ${
            rank <= 3 ? 'bg-brand/20 text-brand-bright' : 'bg-white/5 text-dim'
          }`}
        >
          {rank}
        </span>
      )}
      <span className="w-28 shrink-0 truncate text-xs">{label}</span>
      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/6">
        <span
          className="block h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-24 shrink-0 text-right text-xs font-bold tabular-nums">
        {value.toLocaleString('ko-KR')}
        {suffix}
      </span>
    </li>
  )
}
