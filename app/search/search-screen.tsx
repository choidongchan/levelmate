'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { MateCard } from '@/components/mate-card'
import { GAMES, MATES, type GameKey } from '@/lib/data'

const SORTS = [
  { key: 'rating', label: '평점순' },
  { key: 'price', label: '낮은 가격순' },
  { key: 'reviews', label: '후기 많은순' },
] as const

type SortKey = (typeof SORTS)[number]['key']

export function SearchScreen() {
  const [query, setQuery] = useState('')
  const [game, setGame] = useState<GameKey | 'all'>('all')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('rating')

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
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">메이트 검색</h1>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5">
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
              className="text-dim hover:text-muted"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 pt-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={game === 'all'} onClick={() => setGame('all')}>
            전체
          </Chip>
          {(Object.keys(GAMES) as GameKey[]).map((g) => (
            <Chip key={g} active={game === g} onClick={() => setGame(g)}>
              {GAMES[g].short}
            </Chip>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Chip active={onlineOnly} onClick={() => setOnlineOnly((v) => !v)}>
            온라인만
          </Chip>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={`px-2 py-1 text-xs transition ${
                  sort === s.key ? 'font-semibold text-brand-bright' : 'text-dim hover:text-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-dim">{results.length}명의 메이트</p>

        {results.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((m) => (
              <MateCard key={m.id} mate={m} />
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
          ? 'border-brand bg-brand/15 font-semibold text-brand-bright'
          : 'border-line bg-surface text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon name="search" className="size-8 text-dim" />
      <p className="text-sm text-muted">조건에 맞는 메이트가 없어요</p>
      <p className="text-xs text-dim">필터를 바꾸거나 다른 게임으로 찾아보세요</p>
    </div>
  )
}
