'use client'

import { useSyncExternalStore } from 'react'
import {
  SEED_BOOKINGS,
  SEED_LISTINGS,
  SEED_MESSAGES,
  SEED_SETTLEMENTS,
  SEED_USERS,
} from './seed'
import {
  FEE_RATE,
  type Booking,
  type BookingStatus,
  type Listing,
  type Message,
  type Review,
  type Settlement,
  type User,
} from './types'

/**
 * 화면을 지금 바로 굴리기 위한 클라이언트 저장소.
 * 브라우저 localStorage에 저장되며, DB(Prisma)를 붙이면 이 파일의
 * 액션 본문만 서버 호출로 바꾸면 된다. 화면 코드는 그대로 둔다.
 */

export type State = {
  users: User[]
  listings: Listing[]
  bookings: Booking[]
  messages: Message[]
  reviews: Review[]
  settlements: Settlement[]
  sessionUserId: string | null
}

const KEY = 'levelmate.v1'

function seedState(): State {
  return {
    users: SEED_USERS,
    listings: SEED_LISTINGS,
    bookings: SEED_BOOKINGS,
    messages: SEED_MESSAGES,
    reviews: [],
    settlements: SEED_SETTLEMENTS,
    sessionUserId: null,
  }
}

/** 서버 렌더 시점의 스냅샷. 매번 같은 참조여야 한다. */
const SERVER_STATE: State = seedState()

let state: State = SERVER_STATE
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // 시크릿 모드 등에서 저장이 막혀도 화면은 계속 동작해야 한다.
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next }
  persist()
  emit()
}

export function hydrateStore() {
  if (hydrated) return
  hydrated = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<State>
      state = { ...seedState(), ...saved }
    } else {
      state = seedState()
    }
  } catch {
    state = seedState()
  }
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  )
}

export function getState() {
  return state
}

let seq = 0
function id(prefix: string) {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`
}

function hueFromPhone(phone: string) {
  let h = 0
  for (const ch of phone) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

// ─────────────────────────── 인증 ───────────────────────────

/** 휴대폰 번호로 로그인. 없으면 새로 만든다. (실제 본인인증 연동 전 임시) */
export function login(phone: string, nickname?: string): User {
  const normalized = phone.replace(/[^0-9]/g, '')
  const pretty = normalized.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3')

  const existing = state.users.find((u) => u.phone.replace(/[^0-9]/g, '') === normalized)
  if (existing) {
    set({ sessionUserId: existing.id })
    return existing
  }

  const user: User = {
    id: id('u'),
    nickname: nickname?.trim() || `게이머${normalized.slice(-4)}`,
    hue: hueFromPhone(normalized),
    phone: pretty,
    verified: true, // 인증번호 확인을 마친 상태로 본다
    role: 'MEMBER',
    region: '온라인',
    intro: '',
    photoUrl: null,
    photoStatus: 'NONE',
    createdAt: new Date().toISOString(),
    bannedAt: null,
    kept: 0,
    late: 0,
    cancelLate: 0,
    noShow: 0,
    ratingSum: 0,
    reviewCount: 0,
  }
  set({ users: [...state.users, user], sessionUserId: user.id })
  return user
}

export function logout() {
  set({ sessionUserId: null })
}

export function currentUser(s: State = state): User | null {
  if (!s.sessionUserId) return null
  return s.users.find((u) => u.id === s.sessionUserId) ?? null
}

export function updateProfile(userId: string, patch: Partial<User>) {
  set({ users: state.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) })
}

// ─────────────────────────── 게시글 ───────────────────────────

export function createListing(input: Omit<Listing, 'id' | 'createdAt' | 'active'>): Listing {
  const listing: Listing = {
    ...input,
    id: id('l'),
    createdAt: new Date().toISOString(),
    active: true,
  }
  set({ listings: [listing, ...state.listings] })
  return listing
}

export function toggleListing(listingId: string) {
  set({
    listings: state.listings.map((l) =>
      l.id === listingId ? { ...l, active: !l.active } : l,
    ),
  })
}

export function deleteListing(listingId: string) {
  set({ listings: state.listings.filter((l) => l.id !== listingId) })
}

// ─────────────────────────── 예약 ───────────────────────────

function checkInCode() {
  return `LM-${Math.floor(1000 + Math.random() * 9000)}`
}

export function createBooking(input: {
  listingId: string
  memberId: string
  hostId: string
  startAt: string
  hours: number
  amount: number
  meetMode: Booking['meetMode']
  pcbang: string | null
}): Booking {
  const booking: Booking = {
    ...input,
    id: id('b'),
    status: 'REQUESTED',
    checkInCode: checkInCode(),
    createdAt: new Date().toISOString(),
    settled: false,
  }
  set({ bookings: [booking, ...state.bookings] })
  return booking
}

/**
 * 예약 상태 변경. 완료/노쇼/임박취소는 약속 이행 지표에 그대로 반영된다.
 * 지표가 바뀌면 약속 점수도 같이 움직인다.
 */
export function setBookingStatus(bookingId: string, status: BookingStatus) {
  const booking = state.bookings.find((b) => b.id === bookingId)
  if (!booking) return

  let users = state.users
  const bump = (userId: string, field: 'kept' | 'late' | 'cancelLate' | 'noShow') => {
    users = users.map((u) => (u.id === userId ? { ...u, [field]: u[field] + 1 } : u))
  }

  if (status === 'COMPLETED' && booking.status !== 'COMPLETED') {
    bump(booking.hostId, 'kept')
    bump(booking.memberId, 'kept')
  }
  if (status === 'NO_SHOW' && booking.status !== 'NO_SHOW') {
    bump(booking.hostId, 'noShow')
  }
  if (status === 'CANCELLED' && booking.status === 'CONFIRMED') {
    // 확정된 약속을 취소한 것은 임박 취소로 본다
    bump(booking.memberId, 'cancelLate')
  }

  set({
    users,
    bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  })
}

// ─────────────────────────── 대화 ───────────────────────────

export function sendMessage(bookingId: string, senderId: string, body: string) {
  const text = body.trim()
  if (!text) return
  const message: Message = {
    id: id('m'),
    bookingId,
    senderId,
    body: text,
    createdAt: new Date().toISOString(),
  }
  set({ messages: [...state.messages, message] })
}

// ─────────────────────────── 후기 ───────────────────────────

export function addReview(input: {
  bookingId: string
  authorId: string
  targetId: string
  rating: number
  comment: string
}) {
  const review: Review = { ...input, id: id('r'), createdAt: new Date().toISOString() }
  set({
    reviews: [...state.reviews, review],
    users: state.users.map((u) =>
      u.id === input.targetId
        ? { ...u, ratingSum: u.ratingSum + input.rating, reviewCount: u.reviewCount + 1 }
        : u,
    ),
  })
}

// ─────────────────────────── 운영 ───────────────────────────

export function verifyUser(userId: string, verified: boolean) {
  updateProfile(userId, { verified })
}

export function banUser(userId: string, banned: boolean) {
  updateProfile(userId, { bannedAt: banned ? new Date().toISOString() : null })
}

/** 회원 삭제. 남은 글·예약·대화도 같이 정리한다. */
export function deleteUser(userId: string) {
  const bookingIds = new Set(
    state.bookings.filter((b) => b.memberId === userId || b.hostId === userId).map((b) => b.id),
  )
  set({
    users: state.users.filter((u) => u.id !== userId),
    listings: state.listings.filter((l) => l.userId !== userId),
    bookings: state.bookings.filter((b) => !bookingIds.has(b.id)),
    messages: state.messages.filter((m) => !bookingIds.has(m.bookingId)),
    reviews: state.reviews.filter((r) => r.authorId !== userId && r.targetId !== userId),
    sessionUserId: state.sessionUserId === userId ? null : state.sessionUserId,
  })
}

export function setPhotoStatus(userId: string, status: User['photoStatus']) {
  updateProfile(userId, { photoStatus: status })
}

// ─────────────────────────── 정산 ───────────────────────────

/** 완료됐지만 아직 정산되지 않은 유료 예약을 호스트별로 묶는다. */
export function generateSettlements(): number {
  const targets = state.bookings.filter(
    (b) => b.status === 'COMPLETED' && !b.settled && b.amount > 0,
  )
  if (targets.length === 0) return 0

  const byHost = new Map<string, Booking[]>()
  for (const b of targets) {
    const list = byHost.get(b.hostId) ?? []
    list.push(b)
    byHost.set(b.hostId, list)
  }

  const created: Settlement[] = []
  for (const [hostId, list] of byHost) {
    const gross = list.reduce((sum, b) => sum + b.amount, 0)
    const fee = Math.round(gross * FEE_RATE)
    created.push({
      id: id('s'),
      hostId,
      bookingIds: list.map((b) => b.id),
      gross,
      fee,
      net: gross - fee,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      paidAt: null,
    })
  }

  const settledIds = new Set(targets.map((b) => b.id))
  set({
    settlements: [...created, ...state.settlements],
    bookings: state.bookings.map((b) => (settledIds.has(b.id) ? { ...b, settled: true } : b)),
  })
  return created.length
}

export function paySettlement(settlementId: string) {
  set({
    settlements: state.settlements.map((s) =>
      s.id === settlementId ? { ...s, status: 'PAID', paidAt: new Date().toISOString() } : s,
    ),
  })
}

export function resetStore() {
  state = seedState()
  persist()
  emit()
}
