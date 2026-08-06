import type {
  AdminAccount,
  Booking,
  Listing,
  Message,
  Plan,
  Review,
  Settlement,
  User,
} from './types'

/**
 * 화면이 보는 데이터 한 벌.
 *
 * 서버가 이 모양 그대로 내려주고, 클라이언트 저장소는 그대로 받아 담는다.
 * 서버·클라이언트 양쪽에서 쓰므로 이 파일에는 'use client' 를 붙이지 않는다.
 */
export type State = {
  users: User[]
  listings: Listing[]
  bookings: Booking[]
  messages: Message[]
  reviews: Review[]
  settlements: Settlement[]
  plans: Plan[]
  sessionUserId: string | null
  admins: AdminAccount[]
  adminSessionId: string | null
  /** 서버에서 받은 데이터인지. false 면 아직 비어 있는 화면이다. */
  loaded: boolean
}

/**
 * 서버 렌더 시점의 스냅샷. 항상 같은 참조여야 한다.
 * useSyncExternalStore 가 이 값으로 첫 렌더를 맞추므로 절대 고치면 안 된다.
 */
export const EMPTY_STATE: State = {
  users: [],
  listings: [],
  bookings: [],
  messages: [],
  reviews: [],
  settlements: [],
  plans: [],
  sessionUserId: null,
  admins: [],
  adminSessionId: null,
  loaded: false,
}
