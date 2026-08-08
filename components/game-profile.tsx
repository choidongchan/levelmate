import { Icon } from './icon'
import { gameProfiles, type GameProfileView } from '@/lib/game-profile'
import type { User } from '@/lib/types'

/**
 * 연결된 게임 계정을 보여주는 조각들.
 *
 * 손으로 적은 티어는 아무도 믿지 않는다. 이건 게임사에서 그대로 가져온
 * 값이라, 손으로 적은 것과 눈에 띄게 다르게 그린다 — 게임 색 띠와 확인
 * 표시를 붙이고, 등급은 등급 색으로 크게 쓴다.
 */

// ─────────────────────── 목록용 (작게) ───────────────────────

/**
 * 카드 한 줄에 여러 게임을 나란히 놓는 작은 표.
 *
 * 한 사람이 롤도 하고 배그도 하는 것은 흔한 일이다. 하나만 보여주면
 * "이 사람은 롤만 하는구나" 로 읽혀서, 같이 할 사람을 못 찾게 된다.
 */
export function GameChips({ games, max }: { games: GameProfileView[]; max?: number }) {
  if (games.length === 0) return null
  const shown = max ? games.slice(0, max) : games

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {shown.map((g) => (
        <GameChip key={g.game} game={g} />
      ))}
      {games.length > shown.length && (
        <span className="text-[10px] text-dim">+{games.length - shown.length}</span>
      )}
    </span>
  )
}

export function GameChip({ game }: { game: GameProfileView }) {
  return (
    <span
      className="inline-flex min-w-0 shrink items-center gap-1 rounded-md py-0.5 pr-1.5 pl-1 text-[10px]"
      style={{ background: `${game.tierColor}1f` }}
      title={`${game.gameName} ${game.tier ?? ''} · ${game.account}`}
    >
      <span
        className="shrink-0 rounded-[3px] px-1 font-black"
        style={{ background: `${game.gameColor}33`, color: game.gameColor }}
      >
        {game.gameShort}
      </span>
      <b className="truncate" style={{ color: game.tierColor }}>
        {game.tier ?? '언랭'}
      </b>
      {game.verified && <Icon name="check" className="size-2.5 shrink-0 text-online" />}
    </span>
  )
}

/** 승/패 막대. op.gg 처럼 이긴 쪽이 파랑, 진 쪽이 빨강. */
export function WinBar({
  record,
  className = '',
}: {
  record: NonNullable<GameProfileView['record']>
  className?: string
}) {
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <span className="flex h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-[#f43f5e]/40">
        <span className="h-full bg-[#3b82f6]" style={{ width: `${record.rate}%` }} />
      </span>
      <span className="shrink-0 text-[10px] tabular-nums">
        <b className={record.rate >= 55 ? 'text-[#f43f5e]' : ''}>{record.rate}%</b>
      </span>
    </span>
  )
}

// ─────────────────────── 프로필용 (크게) ───────────────────────

/** 프로필 화면의 "연결된 게임 계정" 묶음 */
export function GameProfileList({ user }: { user: User }) {
  const games = gameProfiles(user)
  if (games.length === 0) return null

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-base font-bold">연결된 게임 계정</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-online/12 px-2 py-0.5 text-[10px] font-bold text-online">
          <Icon name="check" className="size-2.5" />
          게임사 확인
        </span>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-dim">
        직접 적은 값이 아니라 게임사에서 그대로 가져온 기록입니다.
      </p>
      <div className="flex flex-col gap-2.5">
        {games.map((g) => (
          <GameProfileCard key={g.game} game={g} />
        ))}
      </div>
    </section>
  )
}

export function GameProfileCard({ game }: { game: GameProfileView }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-line bg-surface pl-4">
      {/* 왼쪽 색 띠 하나로 어느 게임인지 바로 읽힌다 */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: game.gameColor }}
        aria-hidden
      />

      <div className="flex flex-col gap-3 p-4">
        <header className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
            style={{ background: `${game.gameColor}22`, color: game.gameColor }}
          >
            {game.gameShort}
          </span>
          <span className="min-w-0 truncate text-sm font-bold">{game.account}</span>
          {game.platform && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-dim">
              {game.platform}
            </span>
          )}
          {game.verified && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-online/15 px-2 py-0.5 text-[10px] font-bold text-online">
              <Icon name="shield" className="size-2.5" />
              본인 확인됨
            </span>
          )}
        </header>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p
              className="text-xl leading-none font-black tracking-tight"
              style={{ color: game.tierColor }}
            >
              {game.tier ?? '언랭'}
            </p>
            {game.detail && <p className="mt-1.5 text-[11px] text-dim">{game.detail}</p>}
          </div>

          {game.record && (
            <div className="min-w-32 flex-1 sm:max-w-52">
              <WinBar record={game.record} />
              <p className="mt-1 text-right text-[10px] tabular-nums text-dim">
                {game.record.wins}승 {game.record.losses}패
              </p>
            </div>
          )}
        </div>

        {(game.role || game.stats.length > 0) && (
          <dl className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
            {game.role && (
              <div className="flex gap-1.5 text-[11px]">
                <dt className="text-dim">주 포지션</dt>
                <dd className="font-bold">{game.role}</dd>
              </div>
            )}
            {game.stats.map((s) => (
              <div key={s.label} className="flex gap-1.5 text-[11px]">
                <dt className="text-dim">{s.label}</dt>
                <dd className={`font-bold tabular-nums ${s.hot ? 'text-[#f43f5e]' : ''}`}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {game.picks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="text-[11px] text-dim">자주 하는</span>
            {game.picks.map((p) => (
              <span
                key={p.name}
                className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] whitespace-nowrap"
                title={`${p.games}판`}
              >
                {p.name}{' '}
                <b className={p.rate >= 55 ? 'text-[#f43f5e]' : 'text-dim'}>{p.rate}%</b>
              </span>
            ))}
          </div>
        )}

        {game.syncedAt && (
          <p className="text-[10px] text-dim">
            {new Date(game.syncedAt).toLocaleDateString('ko-KR')} 기준
          </p>
        )}
      </div>
    </article>
  )
}
