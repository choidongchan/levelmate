export type GameKey = 'lol' | 'valorant' | 'pubg' | 'fconline' | 'overwatch' | 'maple' | 'etc'

export const GAMES: Record<GameKey, { name: string; short: string; color: string }> = {
  lol: { name: '리그 오브 레전드', short: 'LOL', color: '#c89b3c' },
  valorant: { name: '발로란트', short: 'VAL', color: '#ff4655' },
  pubg: { name: '배틀그라운드', short: 'PUBG', color: '#f2a900' },
  fconline: { name: 'FC 온라인', short: 'FC', color: '#3b82f6' },
  overwatch: { name: '오버워치', short: 'OW', color: '#f99e1a' },
  maple: { name: '메이플스토리', short: 'MAPLE', color: '#f97316' },
  etc: { name: '기타', short: 'ETC', color: '#94a3b8' },
}

/** 게시글 유형 — 서비스의 핵심 축 */
export type ListingKind = 'TEACH' | 'LEARN' | 'PLAY'

export const LISTING_KINDS: Record<
  ListingKind,
  { label: string; verb: string; color: string; desc: string }
> = {
  TEACH: {
    label: '알려드려요',
    verb: '가르쳐요',
    color: '#a855f7',
    desc: '내가 잘하는 게임을 알려줍니다',
  },
  LEARN: {
    label: '알려주세요',
    verb: '배울래요',
    color: '#22d3ee',
    desc: '이 게임 배우고 싶어요',
  },
  PLAY: {
    label: '같이해요',
    verb: '같이해요',
    color: '#34d399',
    desc: '같이 즐길 사람을 찾아요',
  },
}

/** 진행 방식 */
export type MeetMode = 'ONLINE' | 'OFFLINE' | 'BOTH'

export const MEET_MODES: Record<MeetMode, { label: string; short: string; icon: 'headset' | 'monitor' | 'group' }> = {
  ONLINE: { label: '온라인으로만 해요', short: '온라인', icon: 'headset' },
  OFFLINE: { label: '만나서 같이해요', short: '만나서', icon: 'monitor' },
  BOTH: { label: '온라인·만나서 둘 다 가능', short: '둘 다', icon: 'group' },
}

export type PhotoStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

export type Role = 'MEMBER' | 'ADMIN'

export type User = {
  id: string
  nickname: string
  hue: number
  phone: string
  verified: boolean
  role: Role
  region: string
  intro: string
  photoUrl: string | null
  photoStatus: PhotoStatus
  createdAt: string
  bannedAt: string | null

  // 약속 이행 지표
  kept: number
  late: number
  cancelLate: number
  noShow: number

  ratingSum: number
  reviewCount: number
}

export type Listing = {
  id: string
  userId: string
  kind: ListingKind
  meetMode: MeetMode
  title: string
  body: string
  mainGame: GameKey
  games: GameKey[]
  tier: string
  /** 0이면 무료 */
  pricePerHour: number
  region: string
  pcbang: string | null
  availableFrom: string
  availableTo: string
  createdAt: string
  active: boolean
}

export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export const BOOKING_STATUS: Record<BookingStatus, { label: string; color: string }> = {
  REQUESTED: { label: '수락 대기', color: '#fbbf24' },
  CONFIRMED: { label: '예약 확정', color: '#22d3ee' },
  CHECKED_IN: { label: '진행 중', color: '#a855f7' },
  COMPLETED: { label: '완료', color: '#34d399' },
  CANCELLED: { label: '취소', color: '#94a3b8' },
  NO_SHOW: { label: '노쇼', color: '#f43f5e' },
}

export type Booking = {
  id: string
  listingId: string
  /** 신청한 사람 */
  memberId: string
  /** 글을 올린 사람 */
  hostId: string
  startAt: string
  hours: number
  amount: number
  meetMode: MeetMode
  pcbang: string | null
  status: BookingStatus
  checkInCode: string
  createdAt: string
  settled: boolean
}

export type Message = {
  id: string
  bookingId: string
  senderId: string
  body: string
  createdAt: string
}

export type Review = {
  id: string
  bookingId: string
  authorId: string
  targetId: string
  rating: number
  comment: string
  createdAt: string
}

export type Settlement = {
  id: string
  hostId: string
  bookingIds: string[]
  gross: number
  fee: number
  net: number
  status: 'PENDING' | 'PAID'
  createdAt: string
  paidAt: string | null
}

export const REGIONS = [
  '서울 강남구',
  '서울 마포구',
  '서울 관악구',
  '서울 광진구',
  '경기 성남시 분당구',
  '경기 수원시 영통구',
  '부산 부산진구',
  '대구 중구',
  '온라인',
]

/** 플랫폼 수수료율 */
export const FEE_RATE = 0.15
