'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/icon'
import { ScreenHeader } from '@/components/screen-header'
import { PC_BANGS } from '@/lib/pcbangs'
import { LOL_ROLE_KEYS, LOL_ROLES, type LolRole } from '@/lib/riot'
import { createListing, currentUser, useStore } from '@/lib/store'
import {
  GAMES,
  LISTING_KINDS,
  MEET_MODES,
  REGIONS,
  type GameKey,
  type ListingKind,
  type MeetMode,
} from '@/lib/types'

export default function NewListingPage() {
  const router = useRouter()
  const state = useStore()
  const me = currentUser(state)

  const [kind, setKind] = useState<ListingKind>('PLAY')
  const [meetMode, setMeetMode] = useState<MeetMode>('ONLINE')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mainGame, setMainGame] = useState<GameKey>('lol')
  const [tier, setTier] = useState('')
  const [myRole, setMyRole] = useState<LolRole | null>(null)
  const [wantRoles, setWantRoles] = useState<LolRole[]>([])
  const [free, setFree] = useState(true)
  const [price, setPrice] = useState(15000)
  const [region, setRegion] = useState(REGIONS[0])
  const [pcbang, setPcbang] = useState(PC_BANGS[0])
  const [from, setFrom] = useState('20:00')
  const [to, setTo] = useState('24:00')

  if (!me) {
    return (
      <>
        <ScreenHeader title="글쓰기" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
          <span className="glass grid size-16 place-items-center rounded-3xl">
            <Icon name="id" className="size-7 text-brand-bright" />
          </span>
          <p className="mt-1 text-[15px] font-bold">로그인이 필요해요</p>
          <p className="text-xs leading-relaxed text-dim">
            본인 인증을 마친 사람만 글을 올릴 수 있어요
          </p>
          <button
            type="button"
            onClick={() => router.push('/login?next=/listings/new')}
            className="cta mt-2 rounded-full px-5 py-3 text-sm font-black"
          >
            로그인하기
          </button>
        </main>
      </>
    )
  }

  const isOnline = meetMode === 'ONLINE'
  const canSubmit = title.trim().length >= 4 && body.trim().length >= 10

  return (
    <>
      <ScreenHeader title="글쓰기" />

      <main className="flex flex-col gap-4 px-5 pt-2 pb-6">
        <Section label="어떤 글인가요?">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => {
              const info = LISTING_KINDS[k]
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-2xl border px-2 py-3 text-center transition ${
                    active ? 'border-transparent' : 'border-white/8 bg-white/4'
                  }`}
                  style={active ? { background: `${info.color}22`, borderColor: info.color } : undefined}
                >
                  <span
                    className="block text-[13px] font-bold"
                    style={{ color: active ? info.color : undefined }}
                  >
                    {info.label}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[11px] text-dim">{LISTING_KINDS[kind].desc}</p>
        </Section>

        <Section label="어떻게 진행하나요?">
          <div className="flex flex-col gap-2">
            {(Object.keys(MEET_MODES) as MeetMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeetMode(m)}
                className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  meetMode === m
                    ? 'border-white/25 bg-white/12 font-bold'
                    : 'border-white/8 bg-white/4 text-muted'
                }`}
              >
                <Icon name={MEET_MODES[m].icon} className="size-4 shrink-0 text-brand-bright" />
                {MEET_MODES[m].label}
              </button>
            ))}
          </div>
        </Section>

        <Section label="제목">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="예) 롤 라인전 알려드려요 (미드/탑)"
            className="glass w-full rounded-2xl px-4 py-3.5 text-sm outline-none placeholder:text-dim"
          />
        </Section>

        <Section label="내용">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder="어떤 걸 알려주거나 배우고 싶은지, 어떤 분이면 좋겠는지 적어주세요."
            className="glass w-full resize-none rounded-2xl px-4 py-3.5 text-sm leading-relaxed outline-none placeholder:text-dim"
          />
        </Section>

        <Section label="게임 · 티어">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {(Object.keys(GAMES) as GameKey[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setMainGame(g)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                  mainGame === g ? 'border-transparent bg-white text-ink' : 'border-white/8 bg-white/4 text-muted'
                }`}
              >
                {GAMES[g].short}
              </button>
            ))}
          </div>
          <input
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            maxLength={20}
            placeholder="티어 / 실력 (예: 골드 3, 복귀 유저)"
            className="glass mt-2 w-full rounded-2xl px-4 py-3.5 text-sm outline-none placeholder:text-dim"
          />
          {me.riot?.tier && mainGame === 'lol' && (
            <p className="mt-1.5 px-1 text-[11px] text-online">
              라이엇 계정을 연결해두셨습니다. 목록에는 직접 적은 티어 대신 실제 티어가 나갑니다.
            </p>
          )}
        </Section>

        {/* 롤은 자리가 중요하다. 어디를 서고 누구를 찾는지부터 맞아야 한다. */}
        {mainGame === 'lol' && (
          <Section label="포지션">
            <p className="mb-2 px-1 text-[11px] text-dim">내가 주로 서는 자리</p>
            <div className="flex flex-wrap gap-2">
              {LOL_ROLE_KEYS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMyRole(myRole === r ? null : r)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                    myRole === r
                      ? 'border-transparent bg-white font-bold text-ink'
                      : 'border-white/8 bg-white/4 text-muted'
                  }`}
                >
                  {LOL_ROLES[r].label}
                </button>
              ))}
            </div>

            <p className="mt-3 mb-2 px-1 text-[11px] text-dim">
              찾는 자리 (여러 개 고를 수 있어요 · 안 고르면 상관없음)
            </p>
            <div className="flex flex-wrap gap-2">
              {LOL_ROLE_KEYS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setWantRoles((prev) =>
                      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
                    )
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                    wantRoles.includes(r)
                      ? 'border-transparent bg-brand font-bold text-white'
                      : 'border-white/8 bg-white/4 text-muted'
                  }`}
                >
                  {LOL_ROLES[r].label}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section label="참가비">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFree(true)}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${
                free ? 'bg-online/20 text-online' : 'bg-white/5 text-muted'
              }`}
            >
              무료
            </button>
            <button
              type="button"
              onClick={() => setFree(false)}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold transition ${
                !free ? 'bg-white text-ink' : 'bg-white/5 text-muted'
              }`}
            >
              유료
            </button>
          </div>
          {!free && (
            <label className="glass mt-2 flex items-center gap-2 rounded-2xl px-4 py-3.5">
              <input
                type="number"
                min={1000}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-transparent text-sm outline-none"
              />
              <span className="shrink-0 text-xs text-dim">원 / 시간</span>
            </label>
          )}
        </Section>

        <Section label="지역">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="glass w-full rounded-2xl px-4 py-3.5 text-sm outline-none [color-scheme:dark]"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-[#14141d]">
                {r}
              </option>
            ))}
          </select>

          {!isOnline && (
            <select
              value={pcbang}
              onChange={(e) => setPcbang(e.target.value)}
              className="glass mt-2 w-full rounded-2xl px-4 py-3.5 text-sm outline-none [color-scheme:dark]"
            >
              {PC_BANGS.map((p) => (
                <option key={p} value={p} className="bg-[#14141d]">
                  {p}
                </option>
              ))}
            </select>
          )}
        </Section>

        <Section label="가능한 시간대">
          <div className="grid grid-cols-2 gap-2">
            <label className="glass rounded-2xl px-4 py-3">
              <span className="block text-[11px] text-dim">시작</span>
              <input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none [color-scheme:dark]"
              />
            </label>
            <label className="glass rounded-2xl px-4 py-3">
              <span className="block text-[11px] text-dim">종료</span>
              <input
                type="time"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm outline-none [color-scheme:dark]"
              />
            </label>
          </div>
        </Section>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            const listing = await createListing({
              userId: me.id,
              kind,
              meetMode,
              title: title.trim(),
              body: body.trim(),
              mainGame,
              games: [mainGame],
              tier: tier.trim() || '미기재',
              myRole: mainGame === 'lol' ? myRole : null,
              wantRoles: mainGame === 'lol' ? wantRoles : [],
              pricePerHour: free ? 0 : price,
              region: isOnline ? '온라인' : region,
              pcbang: isOnline ? null : pcbang,
              availableFrom: from,
              availableTo: to,
            })
            if (listing.error) return
            router.replace(`/listings/${listing.id}`)
          }}
          className="cta mt-2 rounded-full py-4 text-sm font-black transition active:scale-[0.99] disabled:opacity-40"
        >
          올리기
        </button>
        {!canSubmit && (
          <p className="text-center text-[11px] text-dim">
            제목 4자, 내용 10자 이상 적어주세요
          </p>
        )}
      </main>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[13px] font-bold">{label}</h2>
      {children}
    </section>
  )
}
