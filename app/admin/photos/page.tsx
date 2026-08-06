'use client'

import { useEffect, useMemo, useState } from 'react'
import { Chip, Empty, PageTitle, Panel, StatCard } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import { removePhoto, setPhotoStatus, useStore } from '@/lib/store'
import type { User } from '@/lib/types'

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'PENDING', label: '검수 대기' },
  { key: 'APPROVED', label: '노출 중' },
  { key: 'REJECTED', label: '반려' },
]

/**
 * 회원이 직접 올린 사진을 확인하는 곳.
 *
 * 올라온 사진은 바로 노출되지 않는다. 여기서 통과시킨 것만 목록과 프로필에 나간다.
 * 남의 사진·부적절한 사진이 그대로 서비스에 걸리는 일을 막기 위한 단계다.
 */
export default function AdminPhotosPage() {
  const s = useStore()
  const [filter, setFilter] = useState<Filter>('PENDING')

  const groups = useMemo(() => {
    const withPhoto = s.users.filter((u) => u.photoUrl)
    return {
      PENDING: withPhoto.filter((u) => u.photoStatus === 'PENDING'),
      APPROVED: withPhoto.filter((u) => u.photoStatus === 'APPROVED'),
      REJECTED: withPhoto.filter((u) => u.photoStatus === 'REJECTED'),
    }
  }, [s.users])

  const rows = groups[filter]

  return (
    <>
      <PageTitle title="사진 검수" desc="회원이 올린 프로필 사진을 확인하고 노출 여부를 정합니다" />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard
          label="검수 대기"
          value={`${groups.PENDING.length}건`}
          icon="clock"
          tone={groups.PENDING.length > 0 ? 'brand' : undefined}
        />
        <StatCard label="노출 중" value={`${groups.APPROVED.length}건`} icon="check" />
        <StatCard label="반려" value={`${groups.REJECTED.length}건`} icon="ban" />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label} {groups[f.key].length}
          </Chip>
        ))}
      </div>

      <Panel title={FILTERS.find((f) => f.key === filter)!.label}>
        {rows.length === 0 ? (
          <Empty
            icon="image"
            text={
              filter === 'PENDING'
                ? '검수할 사진이 없습니다'
                : filter === 'APPROVED'
                  ? '노출 중인 사진이 없습니다'
                  : '반려한 사진이 없습니다'
            }
          />
        ) : (
          <ul className="grid gap-4 py-1 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((u) => (
              <PhotoCard key={u.id} user={u} />
            ))}
          </ul>
        )}
      </Panel>

      <ServerCheck />

      <p className="mt-4 flex gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-dim" />
        <span>
          회원이 올린 사진은 <b className="text-white">통과시키기 전까지 본인에게만</b> 보입니다.
          본인 얼굴이 아닌 사진, 다른 사람 사진, 광고나 연락처가 적힌 사진은 반려해주세요.
          반려하면 회원의 마이 화면에 다시 올려달라는 안내가 뜹니다.
        </span>
      </p>
    </>
  )
}

type Check = {
  total: number
  uploaded: number
  staticPath: number
  stored: number
  broken: { nickname: string; reason: string }[]
}

/**
 * 사진이 실제로 서버에 남아 있는지 확인한다.
 *
 * 화면에 보인다고 서버에 있는 것이 아니다. 올린 사람 브라우저에는 캐시가
 * 남아 있어서, 서버에서 사라져도 본인 화면만 멀쩡해 보인다.
 * 그래서 서버에 직접 물어본다.
 */
function ServerCheck() {
  const [check, setCheck] = useState<Check | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/photo-check', { cache: 'no-store' })
      setCheck(res.ok ? await res.json() : null)
    } catch {
      setCheck(null)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let alive = true
    fetch('/api/admin/photo-check', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive) setCheck(data)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  if (!check) return null

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon name="shield" className="size-3.5 shrink-0 text-dim" />
        <span className="text-[11px] font-bold">서버 보관 상태</span>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="ml-auto rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold transition hover:bg-white/14 disabled:opacity-40"
        >
          {busy ? '확인 중…' : '다시 확인'}
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        사진이 걸린 회원 <b className="text-white">{check.total}명</b> · 올린 사진{' '}
        <b className="text-white">{check.uploaded}건</b> · 경로 직접 입력{' '}
        <b className="text-white">{check.staticPath}건</b> · 서버에 보관 중{' '}
        <b className="text-white">{check.stored}건</b>
      </p>

      {check.broken.length === 0 ? (
        <p className="mt-1 text-[11px] text-online">모두 정상입니다.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {check.broken.map((b, i) => (
            <li key={`${b.nickname}-${i}`} className="flex gap-2 text-[11px] text-[#f43f5e]">
              <Icon name="alert" className="mt-0.5 size-3 shrink-0" />
              <span>
                <b>{b.nickname}</b> — {b.reason}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PhotoCard({ user }: { user: User }) {
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    await fn()
    setBusy(false)
  }

  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-surface-2">
      <div className="relative aspect-[3/4] w-full bg-black">
        {/* 검수 화면에서는 통과 여부와 상관없이 원본을 그대로 봐야 한다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl!}
          alt={`${user.nickname} 이(가) 올린 사진`}
          className="size-full object-cover"
        />
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60 text-xs">
            처리 중…
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-bold">{user.nickname}</p>
        <p className="mt-0.5 truncate text-[11px] text-dim">
          {user.region} · {new Date(user.createdAt).toLocaleDateString('ko-KR')} 가입
        </p>

        <div className="mt-3 flex gap-1.5">
          {user.photoStatus !== 'APPROVED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => setPhotoStatus(user.id, 'APPROVED'))}
              className="flex-1 rounded-lg bg-brand py-2 text-[11px] font-bold transition hover:bg-brand-bright disabled:opacity-40"
            >
              승인
            </button>
          )}
          {user.photoStatus !== 'REJECTED' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => setPhotoStatus(user.id, 'REJECTED'))}
              className="flex-1 rounded-lg bg-white/8 py-2 text-[11px] font-bold transition hover:bg-white/14 disabled:opacity-40"
            >
              반려
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            aria-label="사진 삭제"
            onClick={() => {
              if (confirm(`${user.nickname} 님의 사진을 지울까요?`)) run(() => removePhoto(user.id))
            }}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f43f5e]/15 text-[#f43f5e] transition hover:bg-[#f43f5e]/25 disabled:opacity-40"
          >
            <Icon name="trash" className="size-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}
