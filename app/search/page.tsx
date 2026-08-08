'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { MateRow } from '@/components/mate-row'
import { useView, ViewToggle } from '@/components/view-toggle'
import { ScreenHeader } from '@/components/screen-header'
import { rolesFor } from '@/lib/games'
import { useStore } from '@/lib/store'
import {
  GAMES,
  LISTING_KINDS,
  REGIONS,
  type GameKey,
  type ListingKind,
  type MeetMode,
} from '@/lib/types'

export default function SearchPage() {
  const state = useStore()
  const [view, setView] = useView()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<ListingKind | 'ALL'>('ALL')
  const [game, setGame] = useState<GameKey | 'ALL'>('ALL')
  const [mode, setMode] = useState<MeetMode | 'ALL'>('ALL')
  const [region, setRegion] = useState('전체 지역')
  const [role, setRole] = useState<string>('ALL')
  const [freeOnly, setFreeOnly] = useState(false)

  // 게임을 바꾸면 그 게임의 자리 목록으로 바뀐다
  const gameRoles = game === 'ALL' ? null : rolesFor(game)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.listings
      .filter((l) => l.active)
      .filter((l) => (kind === 'ALL' ? true : l.kind === kind))
      .filter((l) => (game === 'ALL' ? true : l.games.includes(game)))
      .filter((l) => {
        if (mode === 'ALL') return true
        if (mode === 'ONLINE') return l.meetMode === 'ONLINE' || l.meetMode === 'BOTH'
        return l.meetMode === 'OFFLINE' || l.meetMode === 'BOTH'
      })
      .filter((l) => (region === '전체 지역' ? true : l.region === region))
      .filter((l) => (role === 'ALL' ? true : l.myRole === role))
      .filter((l) => (freeOnly ? l.pricePerHour === 0 : true))
      .filter((l) => {
        if (!q) return true
        const author = state.users.find((u) => u.id === l.userId)
        return (
          l.title.toLowerCase().includes(q) ||
          l.body.toLowerCase().includes(q) ||
          l.tier.toLowerCase().includes(q) ||
          (author?.nickname.toLowerCase().includes(q) ?? false) ||
          l.games.some((g) => GAMES[g].name.includes(q) || GAMES[g].short.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state.listings, state.users, query, kind, game, mode, region, role, freeOnly])

  return (
    <>
      <ScreenHeader title="찾기" back={false} />

      <main className="flex flex-col gap-4 px-5 pt-1">
        <div className="glass flex items-center gap-2.5 rounded-full px-4 py-3">
          <Icon name="search" className="size-4 shrink-0 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="게임, 티어, 닉네임으로 검색"
            className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="text-dim transition hover:text-muted"
            >
              ✕
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={kind === 'ALL'} onClick={() => setKind('ALL')}>
            전체
          </Chip>
          {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {LISTING_KINDS[k].label}
            </Chip>
          ))}
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={game === 'ALL'} onClick={() => setGame('ALL')}>
            전체 게임
          </Chip>
          {(Object.keys(GAMES) as GameKey[]).map((g) => (
            <Chip key={g} active={game === g} onClick={() => setGame(g)}>
              {GAMES[g].short}
            </Chip>
          ))}
        </div>

        {/* 자리가 있는 게임을 고르면 그 게임의 자리로 거른다.
            게임마다 자리 이름이 달라서, 게임을 안 고르면 띄우지 않는다. */}
        {gameRoles && (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            <Chip active={role === 'ALL'} onClick={() => setRole('ALL')}>
              전체 포지션
            </Chip>
            {gameRoles.map((r) => (
              <Chip
                key={r.key}
                active={role === r.key}
                onClick={() => setRole(role === r.key ? 'ALL' : r.key)}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-muted outline-none [color-scheme:dark]"
          >
            {['전체 지역', ...REGIONS].map((r) => (
              <option key={r} value={r} className="bg-[#14141d]">
                {r}
              </option>
            ))}
          </select>
          <Chip active={mode === 'ONLINE'} onClick={() => setMode(mode === 'ONLINE' ? 'ALL' : 'ONLINE')}>
            온라인
          </Chip>
          <Chip active={mode === 'OFFLINE'} onClick={() => setMode(mode === 'OFFLINE' ? 'ALL' : 'OFFLINE')}>
            만나서
          </Chip>
          <Chip active={freeOnly} onClick={() => setFreeOnly((v) => !v)}>
            무료만
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-dim">
            <span className="font-bold text-white">{results.length}</span>개의 글
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="glass grid size-14 place-items-center rounded-2xl">
              <Icon name="search" className="size-6 text-dim" />
            </span>
            <p className="mt-1 text-sm font-semibold">조건에 맞는 글이 없어요</p>
            <p className="text-xs text-dim">필터를 바꿔보세요</p>
          </div>
        ) : (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'flex flex-col gap-2'
            }
          >
            {results.map((l, i) => {
              const author = state.users.find((u) => u.id === l.userId)
              if (!author) return null
              return (
                <MateRow
                  key={l.id}
                  user={author}
                  listing={l}
                  index={i}
                  href={`/listings/${l.id}`}
                  view={view}
                />
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

function Chip({
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
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition ${
        active
          ? 'border-transparent bg-white font-bold text-ink'
          : 'border-white/8 bg-white/4 text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
