'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PromiseDetail } from '@/components/badges'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { ratingAvg } from '@/lib/promise-score'
import { currentUser, logout, updateProfile, useStore } from '@/lib/store'
import { REGIONS } from '@/lib/types'

export default function MyPage() {
  const state = useStore()
  const me = currentUser(state)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [intro, setIntro] = useState('')
  const [region, setRegion] = useState(REGIONS[0])

  const myListings = useMemo(
    () => state.listings.filter((l) => l.userId === me?.id),
    [state.listings, me],
  )

  if (!me) {
    return (
      <>
        <ScreenHeader title="마이" back={false} />
        <LoginRequired next="/my" desc="내 정보는 로그인 후에 볼 수 있어요" />
      </>
    )
  }

  const rating = ratingAvg(me)

  return (
    <>
      <ScreenHeader title="마이" back={false} />

      <main className="flex flex-col gap-4 px-5 pt-1">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <UserArt user={me} className="size-16 shrink-0 rounded-3xl" sizes="64px" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-lg font-black tracking-tight">{me.nickname}</span>
                {me.verified && <Icon name="shield" className="size-4 shrink-0 text-online" />}
              </div>
              <p className="mt-0.5 text-xs text-dim">
                {me.region} · {me.phone}
              </p>
              {rating !== null && (
                <p className="mt-1 flex items-center gap-1 text-xs">
                  <Icon name="star" className="size-3 text-star" />
                  <span className="font-bold">{rating}</span>
                  <span className="text-dim">({me.reviewCount})</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setNickname(me.nickname)
                setIntro(me.intro)
                setRegion(me.region)
                setEditing((v) => !v)
              }}
              className="shrink-0 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
            >
              {editing ? '닫기' : '수정'}
            </button>
          </div>

          {me.intro && !editing && (
            <p className="mt-3 text-xs leading-relaxed text-muted">{me.intro}</p>
          )}

          {editing && (
            <div className="mt-4 flex flex-col gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={12}
                placeholder="닉네임"
                className="rounded-2xl bg-white/6 px-4 py-3 text-sm outline-none placeholder:text-dim"
              />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-2xl bg-white/6 px-4 py-3 text-sm outline-none [color-scheme:dark]"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-[#14141d]">
                    {r}
                  </option>
                ))}
              </select>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="한 줄 소개"
                className="resize-none rounded-2xl bg-white/6 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-dim"
              />
              <button
                type="button"
                onClick={() => {
                  updateProfile(me.id, { nickname: nickname.trim() || me.nickname, intro, region })
                  setEditing(false)
                }}
                className="brand-gradient rounded-2xl py-3 text-sm font-bold"
              >
                저장
              </button>
            </div>
          )}
        </section>

        <PromiseDetail user={me} />

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-bold">내가 올린 글 {myListings.length}</h2>
          <div className="flex flex-col gap-2">
            {myListings.length === 0 ? (
              <Link
                href="/listings/new"
                className="glass flex items-center justify-center gap-1.5 rounded-3xl py-6 text-sm font-bold text-brand-bright"
              >
                <Icon name="plus" className="size-4" />첫 글 올리기
              </Link>
            ) : (
              myListings.map((l) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-white/8"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
                  <Icon name="chevronRight" className="size-4 shrink-0 text-dim" />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          {me.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition hover:bg-white/8"
            >
              <Icon name="shield" className="size-4 text-brand-bright" />
              관리자 페이지
              <Icon name="chevronRight" className="ml-auto size-4 text-dim" />
            </Link>
          )}

          <button
            type="button"
            onClick={logout}
            className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-muted transition hover:bg-white/8"
          >
            <Icon name="logout" className="size-4" />
            로그아웃
          </button>
        </section>
      </main>
    </>
  )
}
