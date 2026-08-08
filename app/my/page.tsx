'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PromiseDetail } from '@/components/badges'
import { GameLink } from '@/components/game-link'
import { Icon } from '@/components/icon'
import { LoginRequired } from '@/components/login-required'
import { PhotoPicker } from '@/components/photo-picker'
import { RiotLink } from '@/components/riot-link'
import { ScreenHeader } from '@/components/screen-header'
import { UserArt } from '@/components/user-art'
import { ratingAvg } from '@/lib/promise-score'
import { currentUser, logout, removePhoto, updateProfile, uploadPhoto, useStore } from '@/lib/store'
import { REGIONS, type User } from '@/lib/types'

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
              <PhotoPicker
                value={me.photoUrl}
                nickname={me.nickname}
                onPick={(dataUrl) => uploadPhoto(me.id, dataUrl)}
                onClear={() => removePhoto(me.id)}
              />
              <PhotoStatusNote status={me.photoStatus} hasPhoto={Boolean(me.photoUrl)} />
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
                className="cta rounded-full py-3 text-sm font-black"
              >
                저장
              </button>
            </div>
          )}
        </section>

        <RiotLink me={me} />
        <GameLink me={me} game="pubg" />

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

/**
 * 올린 사진이 지금 어떤 상태인지 알려준다.
 * 검수를 통과해야 남에게 보이므로, 이 말이 없으면 "올렸는데 왜 안 보이지?" 가 된다.
 */
function PhotoStatusNote({
  status,
  hasPhoto,
}: {
  status: User['photoStatus']
  hasPhoto: boolean
}) {
  if (!hasPhoto) {
    return (
      <p className="px-1 text-[11px] leading-relaxed text-dim">
        사진을 올리지 않으면 캐릭터 그림이 대신 보입니다.
      </p>
    )
  }

  const note = {
    PENDING: {
      color: '#fbbf24',
      icon: 'clock' as const,
      text: '검수 중입니다. 통과하면 다른 사람에게도 보입니다. 지금은 나만 볼 수 있어요.',
    },
    APPROVED: {
      color: '#34d399',
      icon: 'check' as const,
      text: '검수를 통과했습니다. 프로필과 목록에 이 사진이 나갑니다.',
    },
    REJECTED: {
      color: '#f43f5e',
      icon: 'alert' as const,
      text: '이 사진은 반려되었습니다. 본인 얼굴이 나온 사진으로 다시 올려주세요.',
    },
    NONE: {
      color: '#94a3b8',
      icon: 'info' as const,
      text: '사진이 아직 검수 대기에 올라가지 않았습니다.',
    },
  }[status]

  return (
    <p className="flex gap-2 px-1 text-[11px] leading-relaxed text-muted">
      <Icon name={note.icon} className="mt-0.5 size-3.5 shrink-0" style={{ color: note.color }} />
      <span>{note.text}</span>
    </p>
  )
}
