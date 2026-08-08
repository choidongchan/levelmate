import type { LolRole, RiotProfile } from './riot'

export type { LolRole, RiotProfile }

export type GameKey = 'lol' | 'valorant' | 'pubg' | 'fconline' | 'overwatch' | 'maple' | 'etc'

/** 라이엇 말고 다른 게임에서 가져온 전적. 게임마다 담기는 값이 다르다. */
export type GameProfile = {
  game: GameKey
  platform: string | null
  name: string
  /** "다이아몬드 3" 처럼 바로 보여줄 수 있는 등급 */
  tier: string | null
  /** "스쿼드 · 4123 RP · 128판" 같은 한 줄 요약 */
  detail: string | null
  stats: Record<string, number | string> | null
  syncedAt: string | null
}

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
  /** 라이엇 계정을 연결했다면 실제 전적. 안 했으면 null. */
  riot?: RiotProfile | null
  /** 라이엇 말고 다른 게임의 연결된 계정 (배그 등) */
  gameAccounts?: GameProfile[]
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
  /** 내가 주로 서는 자리. 게임마다 다르다 (lib/games.ts) */
  myRole: string | null
  /** 이 글에서 찾는 자리 */
  wantRoles: string[]
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

// ─────────── 시안 구성 요소 ───────────

export type Product = {
  id: string
  name: string
  desc: string
  price: string
  unit: string
  icon: 'headset' | 'chart' | 'monitor' | 'group' | 'trophy'
  featured?: boolean
}

export const PRODUCTS: Product[] = [
  { id: 'duo', name: '온라인 듀오', desc: '함께 게임', price: '8,000원~', unit: '/시간', icon: 'headset' },
  { id: 'coach', name: '게임 코칭', desc: '티어 상승', price: '15,000원~', unit: '/시간', icon: 'chart' },
  { id: 'pcbang', name: 'PC방 동행', desc: '제휴 PC방', price: '20,000원~', unit: '/시간', icon: 'monitor', featured: true },
  { id: 'party', name: '5인 파티', desc: '팀 단위 매칭', price: '50,000원~', unit: '/팀', icon: 'group' },
  { id: 'tournament', name: '대회 파트너', desc: '대회 참가', price: '별도 협의', unit: '', icon: 'trophy' },
]

export const HOW_TO_STEPS = [
  { icon: 'search', title: '메이트 검색', desc: '게임, 티어, 지역\n시간 선택' },
  { icon: 'calendar', title: '예약 및 결제', desc: '원하는 시간\n선결제' },
  { icon: 'qr', title: 'PC방 체크인', desc: '제휴 매장 QR\n체크인' },
  { icon: 'gamepad', title: '함께 게임', desc: '즐거운 시간\n함께 플레이' },
  { icon: 'star', title: '평가 및 후기', desc: '상호 평가 후\n정산 완료' },
] as const

export const SAFETY_ITEMS = [
  { icon: 'id', title: '본인 인증', desc: '휴대폰 본인 인증 필수' },
  { icon: 'monitor', title: '제휴 PC방', desc: '지정 PC방에서만 동행 가능' },
  { icon: 'check', title: '안심 결제', desc: '앱 내 안전 결제 시스템' },
  { icon: 'alert', title: '신고 & 차단', desc: '문제 발생 시 즉시 신고' },
  { icon: 'shield', title: '개인정보 보호', desc: '개인 연락처 노출 금지' },
] as const

export const PARTNER_BENEFITS = [
  '프리미엄 좌석 예약',
  '맛있는 F&B 주문',
  '다양한 이벤트 참여',
  '대회 참가 신청',
]

// ─────────── 요금제 ───────────

export type PlanTarget = 'MEMBER' | 'MATE' | 'PCBANG'

export const PLAN_TARGETS: Record<PlanTarget, string> = {
  MEMBER: '이용자',
  MATE: '메이트',
  PCBANG: '제휴 PC방',
}

export type Plan = {
  id: string
  name: string
  target: PlanTarget
  /** 월 구독료. 0이면 무료 */
  monthly: number
  /** 이 요금제에 적용할 중개 수수료율 (0~1) */
  feeRate: number
  features: string[]
  active: boolean
  note: string
}

// ─────────── 관리자 계정 ───────────

/**
 * 관리자는 이용자와 완전히 분리된 계정으로 로그인한다.
 *
 * 비밀번호는 서버에만 해시로 남는다. 화면으로는 절대 내려오지 않으므로
 * 이 타입에도 비밀번호 항목이 없다. 바꿀 때만 새 값을 올려보낸다.
 */
export type AdminAccount = {
  id: string
  username: string
  name: string
  /** 최고 관리자는 삭제할 수 없다 */
  owner: boolean
  active: boolean
  createdAt: string
  lastLoginAt: string | null
}
