import { Icon } from './icon'
import { promiseGrade, promiseScore, promiseTotal } from '@/lib/promise-score'
import { LISTING_KINDS, MEET_MODES, type ListingKind, type MeetMode, type User } from '@/lib/types'

export function KindBadge({ kind, size = 'sm' }: { kind: ListingKind; size?: 'sm' | 'md' }) {
  const k = LISTING_KINDS[kind]
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-bold ${
        size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{ color: k.color, borderColor: `${k.color}55`, background: `${k.color}1a` }}
    >
      {k.label}
    </span>
  )
}

export function ModeBadge({ mode }: { mode: MeetMode }) {
  const m = MEET_MODES[mode]
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted">
      <Icon name={m.icon} className="size-3" />
      {m.short}
    </span>
  )
}

/** 약속 이행 점수. 이 서비스에서 가장 중요한 신뢰 지표라 눈에 띄게 둔다. */
export function PromiseBadge({
  user,
  size = 'sm',
}: {
  user: Pick<User, 'kept' | 'late' | 'cancelLate' | 'noShow'>
  size?: 'sm' | 'md'
}) {
  const score = promiseScore(user)
  const grade = promiseGrade(score)

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={{ color: grade.color, background: `${grade.color}1f` }}
      title={grade.desc}
    >
      <Icon name="check" className={size === 'md' ? 'size-3.5' : 'size-2.5'} />
      {score === null ? '신규' : `약속 ${score}`}
    </span>
  )
}

export function PromiseDetail({ user }: { user: User }) {
  const score = promiseScore(user)
  const grade = promiseGrade(score)
  const total = promiseTotal(user)

  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-dim">약속 이행 점수</p>
          <p className="mt-1 text-3xl font-black tracking-tight" style={{ color: grade.color }}>
            {score === null ? '신규' : score}
            {score !== null && <span className="text-base font-bold text-dim"> / 100</span>}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ color: grade.color, background: `${grade.color}1f` }}
        >
          {grade.label}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted">{grade.desc}</p>

      {total > 0 && (
        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Metric label="지킴" value={user.kept} color="#34d399" />
          <Metric label="지각" value={user.late} color="#fbbf24" />
          <Metric label="임박취소" value={user.cancelLate} color="#f59e0b" />
          <Metric label="노쇼" value={user.noShow} color="#f43f5e" />
        </dl>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white/4 py-2.5">
      <dd className="text-lg font-black" style={{ color: value > 0 ? color : '#4b4b60' }}>
        {value}
      </dd>
      <dt className="mt-0.5 text-[10px] text-dim">{label}</dt>
    </div>
  )
}
