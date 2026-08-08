'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { linkGame, syncGame, unlinkGame } from '@/lib/store'
import { GAMES, type GameKey, type User } from '@/lib/types'

/** 계정을 어느 쪽에 만들었는지 골라야 하는 게임. 한국 배그는 카카오가 많다. */
const PLATFORMS: Partial<Record<GameKey, { key: string; label: string }[]>> = {
  pubg: [
    { key: 'kakao', label: '카카오' },
    { key: 'steam', label: '스팀' },
  ],
}

const HINT: Partial<Record<GameKey, string>> = {
  pubg: '게임 안에서 쓰는 닉네임 그대로 넣어주세요. 대문자·소문자를 가립니다.',
}

/**
 * 라이엇이 아닌 게임의 계정 연결.
 *
 * 라이엇처럼 본인 인증 코드가 없는 게임이라 연결과 갱신만 한다.
 * 게임이 늘면 PLATFORMS·HINT 에 한 줄씩 더하고 <GameLink game="…" /> 만 붙이면 된다.
 */
export function GameLink({ me, game }: { me: User; game: GameKey }) {
  const linked = me.gameAccounts?.find((g) => g.game === game) ?? null
  const platforms = PLATFORMS[game] ?? []
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState(platforms[0]?.key ?? '')
  const [busy, setBusy] = useState<'link' | 'sync' | 'unlink' | null>(null)
  const [error, setError] = useState('')

  const run = async (kind: typeof busy, fn: () => Promise<string | null>) => {
    setError('')
    setBusy(kind)
    const failed = await fn()
    setBusy(null)
    if (failed) setError(failed)
  }

  const title = `${GAMES[game].name} 계정`

  if (!linked) {
    return (
      <section className="glass rounded-3xl p-5">
        <Header title={title} />
        <p className="mt-2 text-xs leading-relaxed text-muted">
          계정을 연결하면 <b className="text-white">실제 랭크 티어와 전적</b>이 내 글에 자동으로
          붙습니다. 직접 적은 티어보다 훨씬 잘 믿어줍니다.
        </p>

        <div className="mt-4 flex gap-2">
          {platforms.length > 0 && (
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="shrink-0 rounded-2xl bg-white/6 px-3 py-3 text-sm outline-none [color-scheme:dark]"
            >
              {platforms.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#14141d]">
                  {p.label}
                </option>
              ))}
            </select>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="게임 닉네임"
            maxLength={30}
            spellCheck={false}
            className="min-w-0 flex-1 rounded-2xl bg-white/6 px-4 py-3 text-sm outline-none placeholder:text-dim"
          />
        </div>

        {error && <p className="mt-2 text-xs text-[#f43f5e]">{error}</p>}

        <button
          type="button"
          disabled={!name.trim() || busy !== null}
          onClick={() => run('link', () => linkGame(game, name, platform || undefined))}
          className="cta mt-3 w-full rounded-full py-3 text-sm font-black disabled:opacity-40"
        >
          {busy === 'link' ? '불러오는 중…' : '계정 연결하기'}
        </button>

        {HINT[game] && <p className="mt-2 text-[11px] leading-relaxed text-dim">{HINT[game]}</p>}
      </section>
    )
  }

  const platformLabel = platforms.find((p) => p.key === linked.platform)?.label

  return (
    <section className="glass rounded-3xl p-5">
      <Header title={title} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">{linked.name}</span>
        {platformLabel && (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-dim">
            {platformLabel}
          </span>
        )}
        {linked.tier ? (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black"
            style={{ background: `${GAMES[game].color}22`, color: GAMES[game].color }}
          >
            {linked.tier}
          </span>
        ) : (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-dim">
            이번 시즌 랭크 없음
          </span>
        )}
      </div>

      {linked.detail && <p className="mt-2 text-xs text-muted">{linked.detail}</p>}
      {linked.stats && <GameStats stats={linked.stats} />}

      {error && <p className="mt-3 text-xs text-[#f43f5e]">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run('sync', () => syncGame(game))}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/8 py-2.5 text-xs font-bold transition hover:bg-white/14 disabled:opacity-40"
        >
          <Icon name="refresh" className="size-3.5" />
          {busy === 'sync' ? '갱신 중…' : '전적 갱신'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => {
            if (confirm('연결을 끊을까요? 티어와 전적이 더 이상 보이지 않습니다.')) {
              void run('unlink', () => unlinkGame(game))
            }
          }}
          className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold text-dim transition hover:bg-white/14"
        >
          연결 끊기
        </button>
      </div>

      {linked.syncedAt && (
        <p className="mt-2 text-[10px] text-dim">
          마지막 갱신 {new Date(linked.syncedAt).toLocaleString('ko-KR')} · 10분에 한 번 갱신할 수
          있어요
        </p>
      )}
    </section>
  )
}

/** 게임마다 담기는 값이 달라, 아는 항목만 골라 보여준다. */
function GameStats({ stats }: { stats: Record<string, number | string> }) {
  const rows: [string, string][] = []
  if (typeof stats.kda === 'number') rows.push(['KDA', String(stats.kda)])
  if (typeof stats.avgDamage === 'number') rows.push(['평균 딜', `${stats.avgDamage}`])
  if (typeof stats.winRate === 'number') rows.push(['승률', `${stats.winRate}%`])
  if (typeof stats.wins === 'number') rows.push(['우승', `${stats.wins}회`])
  if (rows.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {rows.map(([label, value]) => (
        <span key={label} className="text-[11px]">
          <span className="text-dim">{label} </span>
          <b>{value}</b>
        </span>
      ))}
    </div>
  )
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name="gamepad" className="size-4 text-brand-bright" />
      <h2 className="text-[13px] font-bold">{title}</h2>
    </div>
  )
}
