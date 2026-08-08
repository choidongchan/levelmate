import type { LolRole, RiotProfile } from '../riot'
import type {
  AdminAccount,
  Booking,
  GameKey,
  Listing,
  Message,
  Plan,
  Review,
  Settlement,
  User,
} from '../types'

/**
 * DB 행을 화면이 쓰는 모양으로 바꾼다.
 * 날짜는 전부 ISO 문자열로 넘긴다. 화면이 그렇게 쓰고 있고,
 * 중간에 JSON 을 거치면 어차피 문자열이 되기 때문이다.
 */

const iso = (d: Date) => d.toISOString()
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null)

/** 본인·관리자가 아니면 번호 가운데를 가린다. */
export function maskPhone(phone: string) {
  return phone.replace(/^(\d{3})[- ]?(\d{3,4})[- ]?(\d{4})$/, '$1-****-$3')
}

type UserRow = {
  id: string
  nickname: string
  hue: number
  phone: string
  verified: boolean
  role: 'MEMBER' | 'ADMIN'
  region: string
  intro: string
  photoUrl: string | null
  photoStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
  bannedAt: Date | null
  kept: number
  late: number
  cancelLate: number
  noShow: number
  ratingSum: number
  reviewCount: number
  riot?: RiotRow | null
}

type RiotRow = {
  gameName: string
  tagLine: string
  tier: string | null
  division: string | null
  lp: number
  wins: number
  losses: number
  mainRole: string | null
  champions: unknown
  kills: number
  deaths: number
  assists: number
  recentGames: number
  verifiedAt: Date | null
  syncedAt: Date | null
  verifyCode: string | null
}

/** 연결된 라이엇 계정. 화면에 나가는 것은 전적뿐이고 puuid 같은 것은 내보내지 않는다. */
function toRiot(row: RiotRow | null | undefined, isSelf: boolean): RiotProfile | null {
  if (!row) return null
  return {
    gameName: row.gameName,
    tagLine: row.tagLine,
    tier: row.tier,
    division: row.division,
    lp: row.lp,
    wins: row.wins,
    losses: row.losses,
    mainRole: (row.mainRole as LolRole | null) ?? null,
    champions: Array.isArray(row.champions)
      ? (row.champions as RiotProfile['champions'])
      : [],
    kills: row.kills,
    deaths: row.deaths,
    assists: row.assists,
    recentGames: row.recentGames,
    verified: Boolean(row.verifiedAt),
    syncedAt: isoOrNull(row.syncedAt),
    // 확인 코드는 본인만 본다. 남이 알면 그 코드로 남의 계정을 인증해버릴 수 있다.
    verifyCode: isSelf ? row.verifyCode : null,
  }
}

export function toUser(row: UserRow, showPhone: boolean, isSelf = false): User {
  return {
    id: row.id,
    nickname: row.nickname,
    riot: toRiot(row.riot, isSelf),
    hue: row.hue,
    phone: showPhone ? row.phone : maskPhone(row.phone),
    verified: row.verified,
    role: row.role,
    region: row.region,
    intro: row.intro,
    photoUrl: row.photoUrl,
    photoStatus: row.photoStatus,
    createdAt: iso(row.createdAt),
    bannedAt: isoOrNull(row.bannedAt),
    kept: row.kept,
    late: row.late,
    cancelLate: row.cancelLate,
    noShow: row.noShow,
    ratingSum: row.ratingSum,
    reviewCount: row.reviewCount,
  }
}

type ListingRow = {
  id: string
  userId: string
  kind: 'TEACH' | 'LEARN' | 'PLAY'
  meetMode: 'ONLINE' | 'OFFLINE' | 'BOTH'
  title: string
  body: string
  mainGame: string
  games: string[]
  tier: string
  myRole: string | null
  wantRoles: string[]
  pricePerHour: number
  region: string
  pcbang: string | null
  availableFrom: string
  availableTo: string
  createdAt: Date
  active: boolean
}

export function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    meetMode: row.meetMode,
    title: row.title,
    body: row.body,
    mainGame: row.mainGame as GameKey,
    games: row.games as GameKey[],
    tier: row.tier,
    myRole: row.myRole ?? null,
    wantRoles: row.wantRoles ?? [],
    pricePerHour: row.pricePerHour,
    region: row.region,
    pcbang: row.pcbang,
    availableFrom: row.availableFrom,
    availableTo: row.availableTo,
    createdAt: iso(row.createdAt),
    active: row.active,
  }
}

type BookingRow = {
  id: string
  listingId: string
  memberId: string
  hostId: string
  startAt: Date
  hours: number
  amount: number
  meetMode: 'ONLINE' | 'OFFLINE' | 'BOTH'
  pcbang: string | null
  status: Booking['status']
  checkInCode: string
  createdAt: Date
  settled: boolean
}

export function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    listingId: row.listingId,
    memberId: row.memberId,
    hostId: row.hostId,
    startAt: iso(row.startAt),
    hours: row.hours,
    amount: row.amount,
    meetMode: row.meetMode,
    pcbang: row.pcbang,
    status: row.status,
    checkInCode: row.checkInCode,
    createdAt: iso(row.createdAt),
    settled: row.settled,
  }
}

export function toMessage(row: {
  id: string
  bookingId: string
  senderId: string
  body: string
  createdAt: Date
}): Message {
  return { ...row, createdAt: iso(row.createdAt) }
}

export function toReview(row: {
  id: string
  bookingId: string
  authorId: string
  targetId: string
  rating: number
  comment: string
  createdAt: Date
}): Review {
  return { ...row, createdAt: iso(row.createdAt) }
}

export function toSettlement(row: {
  id: string
  hostId: string
  gross: number
  fee: number
  net: number
  status: 'PENDING' | 'PAID'
  createdAt: Date
  paidAt: Date | null
  bookings: { id: string }[]
}): Settlement {
  return {
    id: row.id,
    hostId: row.hostId,
    bookingIds: row.bookings.map((b) => b.id),
    gross: row.gross,
    fee: row.fee,
    net: row.net,
    status: row.status,
    createdAt: iso(row.createdAt),
    paidAt: isoOrNull(row.paidAt),
  }
}

export function toPlan(row: {
  id: string
  name: string
  target: 'MEMBER' | 'MATE' | 'PCBANG'
  monthly: number
  feeRate: number
  features: string[]
  active: boolean
  note: string
}): Plan {
  return { ...row }
}

export function toAdmin(row: {
  id: string
  username: string
  name: string
  owner: boolean
  active: boolean
  createdAt: Date
  lastLoginAt: Date | null
}): AdminAccount {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    owner: row.owner,
    active: row.active,
    createdAt: iso(row.createdAt),
    lastLoginAt: isoOrNull(row.lastLoginAt),
  }
}
