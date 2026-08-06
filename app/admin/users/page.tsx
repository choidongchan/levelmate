'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserEditForm } from '@/components/admin-forms'
import { Chip, Empty, PageTitle, SearchBox, StatCard, Tag } from '@/components/admin-ui'
import { PromiseBadge } from '@/components/badges'
import { Icon } from '@/components/icon'
import { UserArt } from '@/components/user-art'
import { won } from '@/lib/format'
import { promiseScore, ratingAvg } from '@/lib/promise-score'
import { banUser, deleteUser, useStore, verifyUser } from '@/lib/store'
import type { User } from '@/lib/types'

type Filter = 'ALL' | 'UNVERIFIED' | 'BANNED' | 'MATE' | 'RISK'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'UNVERIFIED', label: '미인증' },
  { key: 'BANNED', label: '정지' },
  { key: 'MATE', label: '글 올린 회원' },
  { key: 'RISK', label: '약속 주의' },
]

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <Screen />
    </Suspense>
  )
}

function Screen() {
  const params = useSearchParams()
  const s = useStore()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const term = q.trim()
    return s.users
      .filter((u) => !term || u.nickname.includes(term) || u.phone.includes(term))
      .filter((u) => {
        if (filter === 'UNVERIFIED') return !u.verified
        if (filter === 'BANNED') return !!u.bannedAt
        if (filter === 'MATE') return s.listings.some((l) => l.userId === u.id)
        if (filter === 'RISK') {
          const sc = promiseScore(u)
          return sc !== null && sc < 85
        }
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [s.users, s.listings, q, filter])

  return (
    <>
      <PageTitle title="회원 관리" desc="정보 수정 · 본인인증 · 정지 · 삭제" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체" value={`${s.users.length}명`} icon="users" />
        <StatCard
          label="미인증"
          value={`${s.users.filter((u) => !u.verified).length}명`}
          tone="warn"
        />
        <StatCard
          label="정지"
          value={`${s.users.filter((u) => u.bannedAt).length}명`}
          tone="bad"
        />
        <StatCard
          label="글 올린 회원"
          value={`${new Set(s.listings.map((l) => l.userId)).size}명`}
          tone="brand"
        />
      </div>

      <div className="mb-3 flex flex-col gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="닉네임 또는 번호로 검색" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mb-2 px-1 text-xs text-dim">{rows.length}명</p>

      {rows.length === 0 ? (
        <Empty icon="users" text="조건에 맞는 회원이 없습니다" />
      ) : (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {rows.map((u) => (
            <Row
              key={u.id}
              user={u}
              open={openId === u.id}
              onToggle={() => setOpenId(openId === u.id ? null : u.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function Row({ user, open, onToggle }: { user: User; open: boolean; onToggle: () => void }) {
  const s = useStore()
  const listings = s.listings.filter((l) => l.userId === user.id).length
  const earned = s.bookings
    .filter((b) => b.hostId === user.id && b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.amount, 0)
  const rating = ratingAvg(user)

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <UserArt user={user} className="size-12 shrink-0 rounded-xl" sizes="48px" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-bold">{user.nickname}</span>
            {user.bannedAt && <Tag color="#f43f5e">정지</Tag>}
            {!user.verified && <Tag color="#fbbf24">미인증</Tag>}
            <PromiseBadge user={user} />
          </div>
          <p className="mt-1 truncate text-[11px] text-dim">
            {user.phone} · {user.region} ·{' '}
            {new Date(user.createdAt).toLocaleDateString('ko-KR')} 가입
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            <span>글 {listings}</span>
            <span>후기 {rating !== null ? `${rating} (${user.reviewCount})` : '없음'}</span>
            <span>정산대상 {won(earned)}</span>
            <span className="text-dim">
              지킴 {user.kept} · 지각 {user.late} · 취소 {user.cancelLate} · 노쇼 {user.noShow}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
        >
          {open ? '닫기' : '수정'}
        </button>
        <button
          type="button"
          onClick={() => verifyUser(user.id, !user.verified)}
          className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
        >
          {user.verified ? '인증 해제' : '인증 처리'}
        </button>
        <button
          type="button"
          onClick={() => banUser(user.id, !user.bannedAt)}
          className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
        >
          {user.bannedAt ? '정지 해제' : '정지'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`${user.nickname} 회원을 삭제할까요?\n올린 글·예약·대화도 함께 지워집니다.`)) {
              deleteUser(user.id)
            }
          }}
          aria-label="회원 삭제"
          className="ml-auto grid size-7 place-items-center rounded-full bg-[#f43f5e]/15 text-[#f43f5e] transition hover:bg-[#f43f5e]/25"
        >
          <Icon name="trash" className="size-3.5" />
        </button>
      </div>

      {open && <UserEditForm user={user} onDone={onToggle} />}
    </div>
  )
}
