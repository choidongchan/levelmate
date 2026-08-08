'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { ChampionList, KdaText, RoleTag, TierBadge, WinRateBar } from './riot-badges'
import { linkRiot, syncRiot, unlinkRiot, verifyRiot } from '@/lib/store'
import type { User } from '@/lib/types'

/**
 * 라이엇 계정 연결.
 *
 * 손으로 적은 티어는 아무도 믿지 않는다. 실제 기록을 가져와서 대신 보여준다.
 * 연결만 하면 전적이 보이고, 본인 확인까지 마치면 확인 표시가 붙는다.
 */
export function RiotLink({ me }: { me: User }) {
  const riot = me.riot ?? null
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagLine] = useState('')
  const [busy, setBusy] = useState<'link' | 'sync' | 'verify' | 'unlink' | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const run = async (kind: typeof busy, fn: () => Promise<string | null>) => {
    setError('')
    setNote('')
    setBusy(kind)
    const failed = await fn()
    setBusy(null)
    if (failed) setError(failed)
  }

  if (!riot) {
    return (
      <section className="glass rounded-3xl p-5">
        <Header />
        <p className="mt-2 text-xs leading-relaxed text-muted">
          계정을 연결하면 <b className="text-white">실제 티어와 승률, 자주 하는 챔피언</b>이
          내 글에 자동으로 붙습니다. 직접 적은 티어보다 훨씬 잘 믿어줍니다.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="게임 이름"
            maxLength={30}
            className="min-w-0 flex-1 rounded-2xl bg-white/6 px-4 py-3 text-sm outline-none placeholder:text-dim"
          />
          <div className="flex w-28 shrink-0 items-center rounded-2xl bg-white/6 px-3">
            <span className="text-sm text-dim">#</span>
            <input
              value={tagLine}
              onChange={(e) => setTagLine(e.target.value.replace(/^#/, ''))}
              placeholder="KR1"
              maxLength={10}
              className="w-full bg-transparent px-1 py-3 text-sm outline-none placeholder:text-dim"
            />
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-[#f43f5e]">{error}</p>}

        <button
          type="button"
          disabled={!gameName.trim() || !tagLine.trim() || busy !== null}
          onClick={() => run('link', () => linkRiot(gameName, tagLine))}
          className="cta mt-3 w-full rounded-full py-3 text-sm font-black disabled:opacity-40"
        >
          {busy === 'link' ? '불러오는 중…' : '계정 연결하기'}
        </button>

        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          게임 이름과 태그는 리그 오브 레전드 프로필에서 확인할 수 있습니다. 예: 홍길동 #KR1
        </p>
      </section>
    )
  }

  return (
    <section className="glass rounded-3xl p-5">
      <Header />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">
          {riot.gameName}
          <span className="text-dim">#{riot.tagLine}</span>
        </span>
        <TierBadge riot={riot} size="md" />
        {riot.mainRole && <RoleTag role={riot.mainRole} />}
        {riot.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-online/15 px-2 py-0.5 text-[10px] font-bold text-online">
            <Icon name="shield" className="size-3" />본인 확인됨
          </span>
        ) : (
          <span className="rounded-full bg-[#fbbf24]/15 px-2 py-0.5 text-[10px] font-bold text-[#fbbf24]">
            본인 확인 전
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <WinRateBar riot={riot} />
        <ChampionList riot={riot} />
        <KdaText riot={riot} />
      </div>

      {error && <p className="mt-3 text-xs text-[#f43f5e]">{error}</p>}
      {note && <p className="mt-3 text-xs text-online">{note}</p>}

      {!riot.verified && riot.verifyCode && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <p className="text-xs font-bold">본인 계정인지 확인하기</p>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-[11px] leading-relaxed text-muted">
            <li>리그 오브 레전드를 켠다</li>
            <li>
              설정 → <b className="text-white">일반</b> → 맨 아래{' '}
              <b className="text-white">타사 인증 코드</b> 칸에 아래 코드를 넣고 저장한다
            </li>
            <li>여기로 돌아와 확인 버튼을 누른다</li>
          </ol>

          <div className="mt-3 flex gap-2">
            <code className="flex-1 rounded-xl bg-white/8 px-3 py-2.5 text-center text-sm font-black tracking-wider select-all">
              {riot.verifyCode}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(riot.verifyCode ?? '')
                setNote('코드를 복사했습니다')
              }}
              className="shrink-0 rounded-xl bg-white/8 px-3 text-xs font-bold transition hover:bg-white/14"
            >
              복사
            </button>
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run('verify', verifyRiot)}
            className="mt-2 w-full rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright disabled:opacity-40"
          >
            {busy === 'verify' ? '확인 중…' : '코드 넣었어요 — 확인하기'}
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run('sync', syncRiot)}
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
              void run('unlink', unlinkRiot)
            }
          }}
          className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold text-dim transition hover:bg-white/14"
        >
          연결 끊기
        </button>
      </div>

      {riot.syncedAt && (
        <p className="mt-2 text-[10px] text-dim">
          마지막 갱신 {new Date(riot.syncedAt).toLocaleString('ko-KR')} · 10분에 한 번 갱신할 수
          있어요
        </p>
      )}
    </section>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <Icon name="gamepad" className="size-4 text-brand-bright" />
      <h2 className="text-[13px] font-bold">리그 오브 레전드 계정</h2>
    </div>
  )
}
