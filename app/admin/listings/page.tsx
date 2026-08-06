'use client'

import { useMemo, useState } from 'react'
import { ListingEditForm } from '@/components/admin-forms'
import { Chip, Empty, PageTitle, SearchBox, StatCard, Tag } from '@/components/admin-ui'
import { useStore } from '@/lib/store'
import { GAMES, LISTING_KINDS, MEET_MODES, type ListingKind } from '@/lib/types'

export default function AdminListingsPage() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<ListingKind | 'ALL' | 'HIDDEN'>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const t = q.trim()
    return s.listings
      .filter((l) => !t || l.title.includes(t) || l.tier.includes(t) || l.body.includes(t))
      .filter((l) => (kind === 'ALL' ? true : kind === 'HIDDEN' ? !l.active : l.kind === kind))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [s.listings, q, kind])

  return (
    <>
      <PageTitle title="글 관리" desc="내용 수정 · 숨기기 · 삭제" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체" value={`${s.listings.length}개`} icon="list" />
        <StatCard
          label="노출 중"
          value={`${s.listings.filter((l) => l.active).length}개`}
          tone="good"
        />
        <StatCard label="숨김" value={`${s.listings.filter((l) => !l.active).length}개`} />
        <StatCard
          label="유료"
          value={`${s.listings.filter((l) => l.pricePerHour > 0).length}개`}
          tone="brand"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="제목·내용·티어로 검색" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={kind === 'ALL'} onClick={() => setKind('ALL')}>
            전체
          </Chip>
          {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {LISTING_KINDS[k].label}
            </Chip>
          ))}
          <Chip active={kind === 'HIDDEN'} onClick={() => setKind('HIDDEN')}>
            숨김
          </Chip>
        </div>
      </div>

      <p className="mb-2 px-1 text-xs text-dim">{rows.length}개</p>

      {rows.length === 0 ? (
        <Empty icon="list" text="조건에 맞는 글이 없습니다" />
      ) : (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {rows.map((l) => {
            const author = s.users.find((u) => u.id === l.userId)
            const k = LISTING_KINDS[l.kind]
            return (
              <div key={l.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag color={k.color}>{k.label}</Tag>
                  <Tag color="#9797b4">{MEET_MODES[l.meetMode].short}</Tag>
                  {!l.active && <Tag color="#6a6a86">숨김</Tag>}
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === l.id ? null : l.id)}
                    className="ml-auto shrink-0 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
                  >
                    {openId === l.id ? '닫기' : '수정'}
                  </button>
                </div>

                <p className="mt-2 truncate text-sm font-bold">{l.title}</p>
                <p className="mt-1 truncate text-[11px] text-dim">
                  {author?.nickname ?? '삭제된 회원'} · {GAMES[l.mainGame].short} {l.tier} ·{' '}
                  {l.region} ·{' '}
                  {l.pricePerHour === 0
                    ? '무료'
                    : `${l.pricePerHour.toLocaleString('ko-KR')}원/시간`}{' '}
                  · {new Date(l.createdAt).toLocaleDateString('ko-KR')}
                </p>

                {openId === l.id && (
                  <ListingEditForm listing={l} onDone={() => setOpenId(null)} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
