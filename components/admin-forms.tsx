'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { deleteListing, toggleListing, updateListing, updateProfile } from '@/lib/store'
import { PC_BANGS } from '@/lib/seed'
import {
  GAMES,
  LISTING_KINDS,
  MEET_MODES,
  REGIONS,
  type GameKey,
  type Listing,
  type ListingKind,
  type MeetMode,
  type User,
} from '@/lib/types'

/** 관리자가 회원 정보를 직접 고치는 폼 */
export function UserEditForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [nickname, setNickname] = useState(user.nickname)
  const [region, setRegion] = useState(user.region)
  const [intro, setIntro] = useState(user.intro)
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl ?? '')
  const [role, setRole] = useState(user.role)

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <Field label="닉네임">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
          className="w-full bg-transparent text-sm outline-none"
        />
      </Field>

      <Field label="지역">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r} className="bg-surface-2">
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field label="한 줄 소개">
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={2}
          maxLength={200}
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
        />
      </Field>

      <Field label="프로필 사진 경로 (비워두면 캐릭터 아바타)">
        <input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="/mates/midking.jpg"
          className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
        />
      </Field>

      <Field label="권한">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
          className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
        >
          <option value="MEMBER" className="bg-surface-2">
            일반 회원
          </option>
          <option value="ADMIN" className="bg-surface-2">
            운영자
          </option>
        </select>
      </Field>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={() => {
            const url = photoUrl.trim()
            updateProfile(user.id, {
              nickname: nickname.trim() || user.nickname,
              region,
              intro,
              photoUrl: url || null,
              photoStatus: url ? 'APPROVED' : 'NONE',
              role,
            })
            onDone()
          }}
          className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14"
        >
          취소
        </button>
      </div>
    </div>
  )
}

/** 관리자가 글을 직접 고치는 폼 */
export function ListingEditForm({
  listing,
  onDone,
}: {
  listing: Listing
  onDone: () => void
}) {
  const [d, setD] = useState({
    kind: listing.kind,
    meetMode: listing.meetMode,
    title: listing.title,
    body: listing.body,
    mainGame: listing.mainGame,
    tier: listing.tier,
    pricePerHour: listing.pricePerHour,
    region: listing.region,
    pcbang: listing.pcbang ?? PC_BANGS[0],
    availableFrom: listing.availableFrom,
    availableTo: listing.availableTo,
  })
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) =>
    setD((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="유형">
          <select
            value={d.kind}
            onChange={(e) => set('kind', e.target.value as ListingKind)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          >
            {(Object.keys(LISTING_KINDS) as ListingKind[]).map((k) => (
              <option key={k} value={k} className="bg-surface-2">
                {LISTING_KINDS[k].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="방식">
          <select
            value={d.meetMode}
            onChange={(e) => set('meetMode', e.target.value as MeetMode)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          >
            {(Object.keys(MEET_MODES) as MeetMode[]).map((m) => (
              <option key={m} value={m} className="bg-surface-2">
                {MEET_MODES[m].short}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="제목">
        <input
          value={d.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={50}
          className="w-full bg-transparent text-sm outline-none"
        />
      </Field>

      <Field label="내용">
        <textarea
          value={d.body}
          onChange={(e) => set('body', e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="게임">
          <select
            value={d.mainGame}
            onChange={(e) => set('mainGame', e.target.value as GameKey)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          >
            {(Object.keys(GAMES) as GameKey[]).map((g) => (
              <option key={g} value={g} className="bg-surface-2">
                {GAMES[g].name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="티어 / 실력">
          <input
            value={d.tier}
            onChange={(e) => set('tier', e.target.value)}
            maxLength={20}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="시간당 (0이면 무료)">
          <input
            type="number"
            min={0}
            step={1000}
            value={d.pricePerHour}
            onChange={(e) => set('pricePerHour', Number(e.target.value))}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field label="지역">
          <select
            value={d.region}
            onChange={(e) => set('region', e.target.value)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-surface-2">
                {r}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {d.meetMode !== 'ONLINE' && (
        <Field label="제휴 PC방">
          <select
            value={d.pcbang}
            onChange={(e) => set('pcbang', e.target.value)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          >
            {PC_BANGS.map((b) => (
              <option key={b} value={b} className="bg-surface-2">
                {b}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="가능 시작">
          <input
            type="time"
            value={d.availableFrom}
            onChange={(e) => set('availableFrom', e.target.value)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          />
        </Field>
        <Field label="가능 종료">
          <input
            type="time"
            value={d.availableTo}
            onChange={(e) => set('availableTo', e.target.value)}
            className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
          />
        </Field>
      </div>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={() => {
            updateListing(listing.id, {
              ...d,
              title: d.title.trim() || listing.title,
              pcbang: d.meetMode === 'ONLINE' ? null : d.pcbang,
              region: d.meetMode === 'ONLINE' ? '온라인' : d.region,
            })
            onDone()
          }}
          className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => toggleListing(listing.id)}
          className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14"
        >
          {listing.active ? '숨기기' : '노출'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('이 글을 삭제할까요?')) {
              deleteListing(listing.id)
              onDone()
            }
          }}
          aria-label="글 삭제"
          className="grid size-9 place-items-center rounded-xl bg-[#f43f5e]/15 text-[#f43f5e] transition hover:bg-[#f43f5e]/25"
        >
          <Icon name="trash" className="size-4" />
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl bg-white/5 px-3.5 py-2.5">
      <span className="block text-[10px] text-dim">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  )
}
