'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
import { EMPTY_STATE, type State } from './state'
import type {
  AdminAccount,
  Booking,
  BookingStatus,
  Listing,
  Plan,
  User,
} from './types'

/**
 * 화면이 보는 데이터 한 벌.
 *
 * 데이터는 전부 서버(Postgres)에 있다. 여기서는
 *  1) 서버가 그려 보낸 첫 화면분을 그대로 받아 담고
 *  2) 무언가 바꿀 때마다 서버에 맡긴 뒤, 돌아온 새 한 벌로 갈아끼운다.
 *
 * 그래서 PC 에서 쓴 글이 휴대폰에서도 보이고, 여러 사람이 같이 쓸 수 있다.
 */

export type { State }

/** 서버 렌더가 넘겨준 첫 한 벌. 서버·클라이언트가 같은 값을 봐야 화면이 안 튄다. */
export const InitialStateContext = createContext<State>(EMPTY_STATE)

let state: State = EMPTY_STATE
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

/**
 * 이 화면이 처음 열렸을 때 서버가 돌리고 있던 빌드.
 *
 * 화면을 켜둔 채로 새 버전이 배포되면 이 탭은 옛 코드를 그대로 들고 있게 된다.
 * 그 상태에서는 나만 다른 것을 보게 되고, 본인 화면은 멀쩡해 보여서 알아채기가
 * 아주 어렵다. 서버가 다른 빌드라고 알려주면 한 번 새로 불러온다.
 */
let openedWith: string | null = null
let reloading = false

function checkBuild(next: State) {
  if (!next.build || typeof window === 'undefined') return false
  if (openedWith === null) {
    openedWith = next.build
    return false
  }
  if (openedWith === next.build || reloading) return false
  reloading = true
  window.location.reload()
  return true
}

function set(next: State) {
  if (checkBuild(next)) return
  state = next
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/**
 * 서버가 넘겨준 첫 한 벌을 받아 담는다.
 *
 * 서버에서는 절대 담지 않는다. 모듈 변수는 요청끼리 공유되기 때문에
 * 담아버리면 다른 사람의 화면이 섞인다.
 */
export function adoptInitialState(next: State) {
  if (typeof window === 'undefined') return
  if (state.loaded) return
  if (next.build) openedWith = next.build
  state = next
}

export function useStore(): State {
  const initial = useContext(InitialStateContext)
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  )
  return snapshot.loaded ? snapshot : initial
}

export function getState() {
  return state
}

// ─────────────────────────── 알림 ───────────────────────────

/** 실패했을 때 조용히 넘어가지 않게 화면 위에 띄운다. */
let notice: string | null = null
const noticeListeners = new Set<() => void>()

export function showNotice(message: string | null) {
  notice = message
  for (const l of noticeListeners) l()
}

export function useNotice(): string | null {
  return useSyncExternalStore(
    (cb) => {
      noticeListeners.add(cb)
      return () => noticeListeners.delete(cb)
    },
    () => notice,
    () => null,
  )
}

// ─────────────────────────── 서버 호출 ───────────────────────────

function newId(prefix: string) {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${prefix}-${rand.slice(0, 20)}`
}

/** 서버에서 데이터 한 벌을 다시 받아온다. */
export async function refresh() {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' })
    if (res.ok) set((await res.json()) as State)
  } catch {
    // 잠깐 끊긴 것뿐이라면 화면은 그대로 두는 편이 낫다
  }
}

type Result = string | null

async function post(url: string, body: unknown): Promise<Result> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as { state?: State; error?: string }

    if (!res.ok) {
      const message = data.error || '처리하지 못했습니다'
      showNotice(message)
      // 미리 바꿔둔 화면이 있으면 서버 기준으로 되돌린다
      await refresh()
      return message
    }
    if (data.state) set(data.state)
    return null
  } catch {
    const message = '서버에 연결하지 못했습니다'
    showNotice(message)
    return message
  }
}

const act = (type: string, payload: Record<string, unknown> = {}) =>
  post('/api/action', { type, payload })

// ─────────────────────────── 인증 ───────────────────────────

/** 휴대폰 번호로 로그인. 없으면 새로 만든다. */
export function login(phone: string, nickname?: string): Promise<Result> {
  return post('/api/auth/login', { phone, nickname })
}

export function logout(): Promise<Result> {
  return post('/api/auth/logout', {})
}

export function currentUser(s: State = state): User | null {
  if (!s.sessionUserId) return null
  return s.users.find((u) => u.id === s.sessionUserId) ?? null
}

export function updateProfile(userId: string, patch: Partial<User>): Promise<Result> {
  return act('profile.update', { userId, patch })
}

// ─────────────────────────── 게시글 ───────────────────────────

export async function createListing(
  input: Omit<Listing, 'id' | 'createdAt' | 'active'>,
): Promise<{ id: string; error: Result }> {
  const id = newId('l')
  const error = await act('listing.create', { listing: { ...input, id } })
  return { id, error }
}

export function updateListing(listingId: string, patch: Partial<Listing>): Promise<Result> {
  return act('listing.update', { listingId, patch })
}

export function toggleListing(listingId: string): Promise<Result> {
  return act('listing.toggle', { listingId })
}

export function deleteListing(listingId: string): Promise<Result> {
  return act('listing.delete', { listingId })
}

// ─────────────────────────── 예약 ───────────────────────────

export async function createBooking(input: {
  listingId: string
  memberId: string
  hostId: string
  startAt: string
  hours: number
  amount: number
  meetMode: Booking['meetMode']
  pcbang: string | null
}): Promise<{ id: string; error: Result }> {
  const id = newId('b')
  const error = await act('booking.create', { booking: { ...input, id } })
  return { id, error }
}

/** 완료·노쇼·임박취소는 서버에서 약속 이행 지표에 그대로 반영된다. */
export function setBookingStatus(bookingId: string, status: BookingStatus): Promise<Result> {
  return act('booking.status', { bookingId, status })
}

// ─────────────────────────── 대화 ───────────────────────────

export async function sendMessage(
  bookingId: string,
  senderId: string,
  body: string,
): Promise<Result> {
  const text = body.trim()
  if (!text) return null

  const id = newId('m')
  // 대화는 기다렸다 뜨면 답답하다. 먼저 붙여놓고 서버 결과로 맞춘다.
  set({
    ...state,
    messages: [
      ...state.messages,
      { id, bookingId, senderId, body: text, createdAt: new Date().toISOString() },
    ],
  })
  return act('message.send', { id, bookingId, body: text })
}

// ─────────────────────────── 후기 ───────────────────────────

export function addReview(input: {
  bookingId: string
  authorId: string
  targetId: string
  rating: number
  comment: string
}): Promise<Result> {
  return act('review.add', { ...input, id: newId('r') })
}

// ─────────────────────────── 사진 ───────────────────────────

/** 브라우저에서 잘라 만든 사진을 서버에 올린다. */
export function uploadPhoto(userId: string, dataUrl: string): Promise<Result> {
  return post('/api/photos', { userId, dataUrl })
}

export function removePhoto(userId: string): Promise<Result> {
  return act('photo.remove', { userId })
}

// ─────────────────────────── 라이엇 계정 ───────────────────────────

/** "이름#태그" 로 계정을 연결하고 전적을 가져온다 */
export function linkRiot(gameName: string, tagLine: string): Promise<Result> {
  return post('/api/riot', { op: 'link', gameName, tagLine })
}

export function syncRiot(): Promise<Result> {
  return post('/api/riot', { op: 'sync' })
}

/** 게임 클라이언트에 넣은 코드로 본인 계정임을 확인한다 */
export function verifyRiot(): Promise<Result> {
  return post('/api/riot', { op: 'verify' })
}

export function unlinkRiot(): Promise<Result> {
  return post('/api/riot', { op: 'unlink' })
}

// ─────────────────────────── 운영 ───────────────────────────

export function verifyUser(userId: string, verified: boolean): Promise<Result> {
  return act('user.verify', { userId, verified })
}

export function banUser(userId: string, banned: boolean): Promise<Result> {
  return act('user.ban', { userId, banned })
}

export function deleteUser(userId: string): Promise<Result> {
  return act('user.delete', { userId })
}

export function setPhotoStatus(userId: string, status: User['photoStatus']): Promise<Result> {
  return act('user.photoStatus', { userId, status })
}

// ─────────────────────────── 정산 ───────────────────────────

/** 완료됐지만 아직 정산되지 않은 유료 예약을 호스트별로 묶는다. */
export async function generateSettlements(): Promise<number> {
  const before = state.settlements.length
  const error = await act('settlement.generate')
  if (error) return 0
  return Math.max(0, state.settlements.length - before)
}

export function paySettlement(settlementId: string): Promise<Result> {
  return act('settlement.pay', { settlementId })
}

// ─────────────────────────── 관리자 계정 ───────────────────────────

export function adminLogin(username: string, password: string): Promise<Result> {
  return post('/api/admin/login', { username, password })
}

export function adminLogout(): Promise<Result> {
  return post('/api/admin/logout', {})
}

export function currentAdmin(s: State = state): AdminAccount | null {
  if (!s.adminSessionId) return null
  return s.admins.find((a) => a.id === s.adminSessionId) ?? null
}

export function createAdmin(input: {
  username: string
  password: string
  name: string
}): Promise<Result> {
  return act('admin.create', { ...input, id: newId('a') })
}

export function updateAdmin(
  adminId: string,
  patch: Partial<AdminAccount> & { password?: string },
): Promise<Result> {
  return act('admin.update', { adminId, patch })
}

export function deleteAdmin(adminId: string): Promise<Result> {
  return act('admin.delete', { adminId })
}

export function updatePlan(planId: string, patch: Partial<Plan>): Promise<Result> {
  return act('plan.update', { planId, patch })
}
