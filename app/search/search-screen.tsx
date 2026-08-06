'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { MateCard } from '@/components/mate-card'
import { MateTile } from '@/components/mate-tile'
import { GAMES, MATES, type GameKey } from '@/lib/data'

const SORTS = [
  { key: 'rating', label: '평점순' },
  { key: 'price', label: '낮은 가격순' },
  { key: 'reviews', label: '후기순' },
] as const

type SortKey = (typeof SORTS)[number]['key']

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const [game, setGame] = useState<GameKey | 'all'>('all')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('rating')
  const [grid, setGrid] = useState(true)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()

    return MATES.filter((m) => {
      if (game !== 'all' && !m.games.includes(game)) return false
      if (onlineOnly && !m.online) return false
      if (!q) return true
      return (
        m.nickname.toLowerCase().includes(q) ||
        m.headline.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q) ||
        m.games.some((g) => GAMES[g].name.includes(q) || GAMES[g].short.toLowerCase().includes(q))
      )
    }).sort((a, b) => {
      if (sort === 'price') return a.pricePerHour - b.pricePerHour
      if (sort === 'reviews') return b.reviewCount - a.reviewCount
      return b.rating - a.rating
    })
  }, [query, game, onlineOnly, sort])

  return (
    <>
      <header className="sticky top-0 z-30 bg-ink/70 px-5 pt-4 pb-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-black tracking-tight">메이트 찾기</h1>

        <div className="glass mt-3 flex items-center gap-2.5 rounded-full px-4 py-3">
          <Icon name="search" className="size-4 shrink-0 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임, 게임, 티어로 검색"
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

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <Chip active={game === 'all'} onClick={() => setGame('all')}>
            전체
          </Chip>
          {(Object.keys(GAMES) as GameKey[]).map((g) => (
            <Chip key={g} active={game === g} onClick={() => setGame(g)}>
              {GAMES[g].short}
            </Chip>
          ))}
        </div>
      </header>

      <main className="flex flex-col gap-4 px-5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <Chip active={onlineOnly} onClick={() => setOnlineOnly((v) => !v)}>
            <span className="flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${onlineOnly ? 'bg-online' : 'bg-dim'}`}
              />
              접속중만
            </span>
          </Chip>

          <div className="flex items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={`px-1.5 py-1 text-xs transition ${
                  sort === s.key ? 'font-bold text-white' : 'text-dim hover:text-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGrid((v) => !v)}
              aria-label={grid ? '목록으로 보기' : '격자로 보기'}
              className="ml-1 grid size-7 place-items-center rounded-full text-dim transition hover:bg-white/8 hover:text-white"
            >
              <Icon name={grid ? 'list' : 'grid'} className="size-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-dim">
          <span className="font-bold text-white">{results.length}</span>명의 메이트
        </p>

        {results.length === 0 ? (
          <EmptyState />
        ) : grid ? (
          <div className="grid grid-cols-2 gap-3">
            {results.map((m, i) => (
              <MateTile key={m.id} mate={m} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {results.map((m, i) => (
              <MateCard key={m.id} mate={m} index={i} />
            ))}
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
          : 'border-white/10 bg-white/5 text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <span className="glass grid size-14 place-items-center rounded-2xl">
        <Icon name="search" className="size-6 text-dim" />
      </span>
      <p className="mt-1 text-sm font-semibold">조건에 맞는 메이트가 없어요</p>
      <p className="text-xs text-dim">필터를 바꾸거나 다른 게임으로 찾아보세요</p>
    </div>
  )
}
