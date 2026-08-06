'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Icon, type IconName } from '@/components/icon'
import { InstallHint } from '@/components/install-hint'
import { Logo } from '@/components/logo'
import { MateRow } from '@/components/mate-row'
import { UserArt } from '@/components/user-art'
import { currentUser, useStore } from '@/lib/store'
import {
  HOW_TO_STEPS,
  LISTING_KINDS,
  PARTNER_BENEFITS,
  PRODUCTS,
  REGIONS,
  SAFETY_ITEMS,
  type ListingKind,
} from '@/lib/types'

export default function HomePage() {
  const state = useStore()
  const me = currentUser(state)

  const [region, setRegion] = useState('전체 지역')
  const [regionOpen, setRegionOpen] = useState(false)
  const [kind, setKind] = useState<ListingKind | 'ALL'>('ALL')

  /** 시안의 '추천 메이트' — 활성 글을 가진 사람들을 대표 글 기준으로 보여준다 */
  const mates = useMemo(() => {
    const seen = new Set<string>()
    return state.listings
      .filter((l) => l.active)
      .filter((l) => (kind === 'ALL' ? true : l.kind === kind))
      .filter((l) => (region === '전체 지역' ? true : l.region === region))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((l) => {
        if (seen.has(l.userId)) return []
        seen.add(l.userId)
        const user = state.users.find((u) => u.id === l.userId)
        return user ? [{ user, listing: l }] : []
      })
  }, [state.listings, state.users, kind, region])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur md:border-b-0">
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="text-lg font-bold tracking-tight">한판</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              aria-label="검색"
              className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/8 hover:text-white"
            >
              <Icon name="search" className="size-5" />
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

        <div className="relative mt-2 md:mt-0">
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
              <ul className="absolute top-8 left-0 z-20 max-h-72 w-60 overflow-y-auto rounded-2xl border border-line bg-surface-2 py-1 shadow-2xl">
                {['전체 지역', ...REGIONS].map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegion(r)
                        setRegionOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-surface-3 ${
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

      <main className="flex flex-col gap-8 px-4 pt-4">
        <HeroBanner />
        <ProductStrip />
        <Recommended
          mates={mates}
          kind={kind}
          onKind={setKind}
        />
        <HowTo />
        <Safety />
        <PartnerCard />
        <InstallHint />
      </main>
    </>
  )
}

function HeroBanner() {
  return (
    <Link
      href="/search"
      className="rise relative block overflow-hidden rounded-3xl transition active:scale-[0.99]"
      aria-label="게임 메이트 찾기"
    >
      <Image
        src="/hero.webp"
        alt="한판 — 혼자보다 함께, 게임은 더 재밌다"
        width={1100}
        height={1100}
        priority
        sizes="(max-width: 768px) 100vw, 640px"
        className="h-auto w-full"
      />
    </Link>
  )
}

function ProductStrip() {
  return (
    <section>
      <SectionTitle title="동행 상품" />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className={`flex w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 text-center ${
              p.featured
                ? 'border-brand bg-brand/10 shadow-[0_0_24px_-6px] shadow-brand/60'
                : 'border-line bg-surface'
            }`}
          >
            <Icon
              name={p.icon as IconName}
              className={`size-7 ${p.featured ? 'text-brand-bright' : 'text-muted'}`}
            />
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="text-[11px] text-dim">{p.desc}</p>
            <p className="mt-1 text-[13px] leading-tight font-bold text-brand-bright">
              {p.price}
              {p.unit && <span className="block text-[10px] font-medium text-dim">{p.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Recommended({
  mates,
  kind,
  onKind,
}: {
  mates: { user: import('@/lib/types').User; listing: import('@/lib/types').Listing }[]
  kind: ListingKind | 'ALL'
  onKind: (k: ListingKind | 'ALL') => void
}) {
  return (
    <section>
      <SectionTitle
        title="추천 메이트"
        action={
          <Link href="/search" className="flex items-center gap-0.5 text-xs text-dim hover:text-muted">
            더보기
            <Icon name="chevronRight" className="size-3.5" />
          </Link>
        }
      />

      {/* 글 유형 필터 */}
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={kind === 'ALL'} onClick={() => onKind('ALL')}>
          전체
        </Chip>
        {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => onKind(k)}>
            {LISTING_KINDS[k].label}
          </Chip>
        ))}
      </div>

      {mates.length === 0 ? (
        <p className="py-10 text-center text-sm text-dim">조건에 맞는 메이트가 없어요</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {mates.map(({ user, listing }, i) => (
            <MateRow key={user.id} user={user} listing={listing} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

function HowTo() {
  return (
    <section>
      <SectionTitle title="이용 방법" />
      <ol className="grid grid-cols-5 gap-1">
        {HOW_TO_STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col items-center gap-2 text-center">
            <span className="relative grid size-11 place-items-center rounded-full border border-line bg-surface">
              <Icon name={step.icon as IconName} className="size-5 text-brand-bright" />
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold">
                {i + 1}
              </span>
            </span>
            <span className="text-[11px] font-semibold">{step.title}</span>
            <span className="text-[10px] leading-tight whitespace-pre-line text-dim">
              {step.desc}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Safety() {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-base font-bold">안심하고 이용하세요!</h2>
      <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5">
        {SAFETY_ITEMS.map((item) => (
          <li key={item.title} className="flex flex-col items-center gap-1.5 text-center">
            <Icon name={item.icon as IconName} className="size-6 text-brand-bright" />
            <span className="text-xs font-semibold">{item.title}</span>
            <span className="text-[10px] leading-tight text-dim">{item.desc}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PartnerCard() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-brand/40 p-5"
      style={{ background: 'linear-gradient(150deg, #1a1030 0%, #120b22 60%, #0d0818 100%)' }}
    >
      <h2 className="text-base font-bold text-brand-bright">레벨업 PC방과 함께</h2>
      <p className="mt-1 text-xs text-muted">전국 레벨업 PC방에서 더 특별한 경험을!</p>
      <ul className="mt-4 grid gap-2">
        {PARTNER_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <Icon name="check" className="size-4 shrink-0 text-brand-bright" />
            {b}
          </li>
        ))}
      </ul>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-10 size-36 rounded-full bg-brand/20 blur-3xl"
      />
    </section>
  )
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
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
