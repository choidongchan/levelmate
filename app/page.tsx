'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Icon, type IconName } from '@/components/icon'
import { InstallHint } from '@/components/install-hint'
import { ListingCard } from '@/components/listing-card'
import { Logo } from '@/components/logo'
import { MascotPair } from '@/components/mascots'
import { UserArt } from '@/components/user-art'
import { currentUser, useStore } from '@/lib/store'
import {
  LISTING_KINDS,
  REGIONS,
  type ListingKind,
  type MeetMode,
} from '@/lib/types'

type KindFilter = ListingKind | 'ALL'
type ModeFilter = MeetMode | 'ALL'

export default function HomePage() {
  const state = useStore()
  const me = currentUser(state)

  const [kind, setKind] = useState<KindFilter>('ALL')
  const [mode, setMode] = useState<ModeFilter>('ALL')
  const [region, setRegion] = useState<string>('전체 지역')
  const [regionOpen, setRegionOpen] = useState(false)

  const listings = useMemo(() => {
    return state.listings
      .filter((l) => l.active)
      .filter((l) => (kind === 'ALL' ? true : l.kind === kind))
      .filter((l) => {
        if (mode === 'ALL') return true
        if (mode === 'ONLINE') return l.meetMode === 'ONLINE' || l.meetMode === 'BOTH'
        return l.meetMode === 'OFFLINE' || l.meetMode === 'BOTH'
      })
      .filter((l) => (region === '전체 지역' ? true : l.region === region))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state.listings, kind, mode, region])

  const authorOf = (userId: string) => state.users.find((u) => u.id === userId)

  return (
    <>
      <header className="sticky top-0 z-30 bg-ink/70 px-5 pt-4 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="text-[19px] font-black tracking-tight">한판</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              aria-label="검색"
              className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/8 hover:text-white"
            >
              <Icon name="search" className="size-[19px]" />
            </Link>
            {me ? (
              <Link href="/my" aria-label="마이">
                <UserArt user={me} className="size-8 rounded-full" sizes="32px" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold transition hover:bg-white/16"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* 지역 선택 — 만나서 하는 동행은 지역이 핵심이라 항상 위에 둔다 */}
        <div className="relative mt-2.5 md:mt-0">
          <button
            type="button"
            onClick={() => setRegionOpen((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted transition hover:text-white"
          >
            <Icon name="location" className="size-4 text-brand-bright" />
            {region}
            <Icon
              name="chevronDown"
              className={`size-4 transition ${regionOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {regionOpen && (
            <>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setRegionOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <ul className="absolute top-8 left-0 z-20 max-h-72 w-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#14141d] py-1 shadow-2xl">
                {['전체 지역', ...REGIONS].map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegion(r)
                        setRegionOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/6 ${
                        r === region ? 'text-brand-bright' : 'text-muted'
                      }`}
                    >
                      {r}
                      {r === region && <Icon name="check" className="size-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6 px-5 pt-3">
        <Hero />

        <section>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            <Tab active={kind === 'ALL'} onClick={() => setKind('ALL')}>
              전체
            </Tab>
            {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => (
              <Tab
                key={k}
                active={kind === k}
                onClick={() => setKind(k)}
                color={LISTING_KINDS[k].color}
              >
                {LISTING_KINDS[k].label}
              </Tab>
            ))}
          </div>

          <div className="mt-2.5 flex gap-2">
            <Chip active={mode === 'ALL'} onClick={() => setMode('ALL')}>
              전체
            </Chip>
            <Chip active={mode === 'ONLINE'} onClick={() => setMode('ONLINE')}>
              <Icon name="headset" className="size-3" /> 온라인
            </Chip>
            <Chip active={mode === 'OFFLINE'} onClick={() => setMode('OFFLINE')}>
              <Icon name="monitor" className="size-3" /> 만나서
            </Chip>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <p className="text-xs text-dim">
            <span className="font-bold text-white">{listings.length}</span>개의 글
          </p>

          {listings.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((l, i) => {
              const author = authorOf(l.userId)
              if (!author) return null
              return <ListingCard key={l.id} listing={l} author={author} index={i} />
            })}
            </div>
          )}
        </section>

        <InstallHint />

        <footer className="pt-2 pb-4 text-center">
          <p className="text-[10px] leading-relaxed text-dim">
            한판은 게임 메이트 매칭을 중개하는 플랫폼입니다.
            <br />
            만나서 진행하는 동행은 제휴 PC방 내에서만 이뤄집니다.
          </p>
        </footer>
      </main>

      {/* 글쓰기 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 md:hidden">
        <div className="mx-auto flex max-w-md justify-end px-5">
          <Link
            href="/listings/new"
            className="cta pointer-events-auto flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-black transition active:scale-95"
          >
            <Icon name="plus" className="size-4" />
            글쓰기
          </Link>
        </div>
      </div>
    </>
  )
}

function Hero() {
  return (
    <section className="rise relative overflow-hidden rounded-[2rem] px-5 pt-6 pb-5 text-center"
      style={{ background: 'linear-gradient(160deg, #c4b5fd 0%, #a78bfa 45%, #8b5cf6 100%)' }}
    >
      {/* 도트 패턴 */}
      <span
        aria-hidden
        className="dots pointer-events-none absolute inset-0 opacity-25"
      />

      <div className="relative">
        <span className="inline-block rounded-full bg-[#1b1030] px-3.5 py-1.5 text-[10px] font-bold tracking-wide text-white">
          PC방 게임 매칭
        </span>

        <p className="mt-3 text-[13px] font-bold text-[#2a1650]">
          혼자보다 함께, 게임은 <span className="text-[#db2777]">더 재밌다!</span>
        </p>

        {/* 말풍선 로고 */}
        <div className="sticker relative mx-auto mt-3 inline-block rounded-[1.6rem] bg-[#1b1030] px-7 py-4">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[#f9a8d4] px-2.5 py-0.5 text-[10px] font-black text-[#831843]">
            한판?
          </span>
          <p className="text-[30px] leading-none font-black tracking-tight">
            <span className="text-white">HAN</span>
            <span className="bg-gradient-to-r from-[#f0abfc] to-[#f472b6] bg-clip-text text-transparent">
              PAN
            </span>
          </p>
          <p className="mt-1.5 text-[9px] font-bold tracking-[0.15em] text-white/70">
            FIND YOUR GAMING BUDDY!
          </p>
          <span
            aria-hidden
            className="absolute -bottom-2 left-14 size-5 rotate-45 border-r-4 border-b-4 border-white bg-[#1b1030]"
          />
        </div>

        <MascotPair className="mx-auto mt-4 w-full max-w-[19rem]" />

        {/* 기능 스트립 */}
        <ul className="mt-3 grid grid-cols-4 gap-1 rounded-3xl bg-white/95 px-2 py-3">
          {[
            { icon: 'clock', label: '빠른 매칭' },
            { icon: 'group', label: '함께 플레이' },
            { icon: 'chat', label: '실시간 채팅' },
            { icon: 'trophy', label: '같이 승리' },
          ].map((f) => (
            <li key={f.label} className="flex flex-col items-center gap-1.5">
              <Icon name={f.icon as IconName} className="size-5 text-[#7c3aed]" />
              <span className="text-[10px] font-bold text-[#3b2a5c]">{f.label}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/listings/new"
          className="cta mt-3 flex items-center justify-center gap-1.5 rounded-full py-3 text-sm font-black text-white transition active:scale-[0.99]"
        >
          지금 바로 <span className="text-[#fde047]">한판</span> 하러 가자!
          <Icon name="chevronRight" className="size-4" />
        </Link>
      </div>
    </section>
  )
}

function Tab({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition ${
        active ? 'text-ink' : 'bg-white/5 text-muted hover:text-white'
      }`}
      style={active ? { background: color ?? '#ffffff' } : undefined}
    >
      {children}
    </button>
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
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] transition ${
        active
          ? 'border-white/25 bg-white/12 font-bold text-white'
          : 'border-white/8 bg-white/4 text-dim hover:text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="glass grid size-14 place-items-center rounded-2xl">
        <Icon name="search" className="size-6 text-dim" />
      </span>
      <p className="mt-1 text-sm font-semibold">조건에 맞는 글이 없어요</p>
      <p className="text-xs text-dim">필터를 바꾸거나 첫 글을 올려보세요</p>
    </div>
  )
}
