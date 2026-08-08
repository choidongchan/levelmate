import { db } from '../db'
import { ALL_ROLE_KEYS } from '../games'
import { FEE_RATE } from '../types'
import { adminExpiry, hashPassword, newToken, type Viewer } from './auth'

/** 화면에 그대로 보여줄 수 있는 오류. 그 외는 '처리하지 못했습니다' 로 뭉갠다. */
export class ActionError extends Error {}

const fail = (msg: string): never => {
  throw new ActionError(msg)
}

// ─────────────────────────── 입력 검사 ───────────────────────────

const ID_RE = /^[a-z]{1,3}-[a-z0-9-]{1,48}$/i

function id(v: unknown, what = '식별자'): string {
  if (typeof v !== 'string' || !ID_RE.test(v)) fail(`${what}가 올바르지 않습니다`)
  return v as string
}

function text(v: unknown, max: number, what: string, min = 0): string {
  if (typeof v !== 'string') fail(`${what}를 입력해주세요`)
  const s = (v as string).trim()
  if (s.length < min) fail(`${what}를 입력해주세요`)
  return s.slice(0, max)
}

function num(v: unknown, min: number, max: number, what: string): number {
  const n = Number(v)
  if (!Number.isFinite(n)) fail(`${what}가 올바르지 않습니다`)
  return Math.min(max, Math.max(min, Math.round(n)))
}

function pick<T extends string>(v: unknown, allowed: readonly T[], what: string): T {
  if (typeof v !== 'string' || !allowed.includes(v as T)) fail(`${what}가 올바르지 않습니다`)
  return v as T
}

function when(v: unknown, what: string): Date {
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) fail(`${what}가 올바르지 않습니다`)
  return d
}

const KINDS = ['TEACH', 'LEARN', 'PLAY'] as const
const MODES = ['ONLINE', 'OFFLINE', 'BOTH'] as const
const GAME_KEYS = ['lol', 'valorant', 'pubg', 'fconline', 'overwatch', 'maple', 'etc'] as const
const BOOKING_STATES = [
  'REQUESTED',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const
const PHOTO_STATES = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'] as const
const PLAN_TARGETS = ['MEMBER', 'MATE', 'PCBANG'] as const
/** 게임마다 자리 이름이 다르다. 어느 게임의 것이든 받되, 아는 값만 받는다. */
const ROLES = ALL_ROLE_KEYS as readonly string[]

/** 포지션 목록. 빈 값이면 '상관없음' 으로 본다. */
function roles(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return [...new Set(v.map((r) => pick(r, ROLES, '포지션')))].slice(0, 5)
}

/** 시간표는 "13:00" 같은 형태만 받는다 */
function clock(v: unknown, what: string): string {
  const s = String(v ?? '')
  if (!/^\d{1,2}:\d{2}$/.test(s)) fail(`${what}가 올바르지 않습니다`)
  return s
}

// ─────────────────────────── 권한 ───────────────────────────

function requireLogin(v: Viewer): string {
  if (!v.userId) fail('로그인이 필요합니다')
  return v.userId as string
}

function requireAdmin(v: Viewer) {
  if (!v.isAdmin) fail('관리자만 할 수 있습니다')
}

/** 본인이거나 관리자여야 한다 */
function requireSelfOrAdmin(v: Viewer, userId: string) {
  if (v.isAdmin) return
  if (v.userId !== userId) fail('권한이 없습니다')
}

// ─────────────────────────── 실행 ───────────────────────────

type Payload = Record<string, unknown>

export async function runAction(type: string, p: Payload, viewer: Viewer): Promise<void> {
  switch (type) {
    // ── 프로필 ──────────────────────────────────────────────
    case 'profile.update': {
      const userId = id(p.userId, '회원')
      requireSelfOrAdmin(viewer, userId)
      const patch = (p.patch ?? {}) as Payload

      const data: Record<string, unknown> = {}
      if ('nickname' in patch) data.nickname = text(patch.nickname, 12, '닉네임', 1)
      if ('region' in patch) data.region = text(patch.region, 40, '지역', 1)
      if ('intro' in patch) data.intro = text(patch.intro, 200, '소개')

      // 사진 주소와 권한은 관리자만 직접 건드릴 수 있다.
      // 본인 사진은 업로드 경로(/api/photos)로만 바뀐다.
      if (viewer.isAdmin) {
        if ('photoUrl' in patch) {
          const raw = patch.photoUrl
          data.photoUrl = raw === null || raw === '' ? null : text(raw, 300, '사진 주소', 1)
        }
        if ('photoStatus' in patch)
          data.photoStatus = pick(patch.photoStatus, PHOTO_STATES, '사진 상태')
        if ('role' in patch) data.role = pick(patch.role, ['MEMBER', 'ADMIN'] as const, '권한')
        if ('verified' in patch) data.verified = Boolean(patch.verified)
      }

      if (Object.keys(data).length === 0) return
      await db.user.update({ where: { id: userId }, data })
      return
    }

    case 'photo.remove': {
      // 사진을 내리는 것은 본인도 할 수 있다. 올리는 것은 /api/photos 로 간다.
      const userId = id(p.userId, '회원')
      requireSelfOrAdmin(viewer, userId)
      await db.user.update({
        where: { id: userId },
        data: { photoUrl: null, photoStatus: 'NONE' },
      })
      return
    }

    // ── 글 ─────────────────────────────────────────────────
    case 'listing.create': {
      const me = requireLogin(viewer)
      const l = (p.listing ?? {}) as Payload
      const userId = id(l.userId, '글쓴이')
      if (userId !== me && !viewer.isAdmin) fail('본인 이름으로만 올릴 수 있습니다')

      const meetMode = pick(l.meetMode, MODES, '진행 방식')
      const games = Array.isArray(l.games)
        ? [...new Set(l.games.map((g) => pick(g, GAME_KEYS, '게임')))]
        : []

      await db.listing.create({
        data: {
          id: id(l.id, '글'),
          userId,
          kind: pick(l.kind, KINDS, '유형'),
          meetMode,
          title: text(l.title, 50, '제목', 2),
          body: text(l.body, 2000, '내용', 2),
          mainGame: pick(l.mainGame, GAME_KEYS, '게임'),
          games: games.length ? games : [pick(l.mainGame, GAME_KEYS, '게임')],
          tier: text(l.tier, 20, '티어'),
          myRole: l.myRole ? pick(l.myRole, ROLES, '내 포지션') : null,
          wantRoles: roles(l.wantRoles),
          pricePerHour: num(l.pricePerHour, 0, 1_000_000, '금액'),
          region: meetMode === 'ONLINE' ? '온라인' : text(l.region, 40, '지역', 1),
          pcbang: meetMode === 'ONLINE' ? null : text(l.pcbang ?? '', 60, 'PC방') || null,
          availableFrom: clock(l.availableFrom, '시작 시간'),
          availableTo: clock(l.availableTo, '종료 시간'),
        },
      })
      return
    }

    case 'listing.update': {
      const listingId = id(p.listingId, '글')
      const owner = await db.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      })
      if (!owner) fail('없는 글입니다')
      requireSelfOrAdmin(viewer, owner!.userId)

      const patch = (p.patch ?? {}) as Payload
      const data: Record<string, unknown> = {}
      if ('kind' in patch) data.kind = pick(patch.kind, KINDS, '유형')
      if ('meetMode' in patch) data.meetMode = pick(patch.meetMode, MODES, '진행 방식')
      if ('title' in patch) data.title = text(patch.title, 50, '제목', 2)
      if ('body' in patch) data.body = text(patch.body, 2000, '내용', 2)
      if ('mainGame' in patch) data.mainGame = pick(patch.mainGame, GAME_KEYS, '게임')
      if ('games' in patch && Array.isArray(patch.games))
        data.games = [...new Set(patch.games.map((g) => pick(g, GAME_KEYS, '게임')))]
      if ('tier' in patch) data.tier = text(patch.tier, 20, '티어')
      if ('myRole' in patch)
        data.myRole = patch.myRole ? pick(patch.myRole, ROLES, '내 포지션') : null
      if ('wantRoles' in patch) data.wantRoles = roles(patch.wantRoles)
      if ('pricePerHour' in patch)
        data.pricePerHour = num(patch.pricePerHour, 0, 1_000_000, '금액')
      if ('region' in patch) data.region = text(patch.region, 40, '지역', 1)
      if ('pcbang' in patch)
        data.pcbang = patch.pcbang ? text(patch.pcbang, 60, 'PC방') : null
      if ('availableFrom' in patch) data.availableFrom = clock(patch.availableFrom, '시작 시간')
      if ('availableTo' in patch) data.availableTo = clock(patch.availableTo, '종료 시간')
      if ('active' in patch) data.active = Boolean(patch.active)

      if (Object.keys(data).length === 0) return
      await db.listing.update({ where: { id: listingId }, data })
      return
    }

    case 'listing.toggle': {
      const listingId = id(p.listingId, '글')
      const row = await db.listing.findUnique({
        where: { id: listingId },
        select: { userId: true, active: true },
      })
      if (!row) fail('없는 글입니다')
      requireSelfOrAdmin(viewer, row!.userId)
      await db.listing.update({ where: { id: listingId }, data: { active: !row!.active } })
      return
    }

    case 'listing.delete': {
      const listingId = id(p.listingId, '글')
      const row = await db.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      })
      if (!row) return
      requireSelfOrAdmin(viewer, row!.userId)
      await db.listing.delete({ where: { id: listingId } })
      return
    }

    // ── 예약 ───────────────────────────────────────────────
    case 'booking.create': {
      const me = requireLogin(viewer)
      const b = (p.booking ?? {}) as Payload
      const listingId = id(b.listingId, '글')

      const listing = await db.listing.findUnique({
        where: { id: listingId },
        select: { userId: true, pricePerHour: true, active: true, pcbang: true },
      })
      if (!listing || !listing.active) fail('신청할 수 없는 글입니다')
      if (listing!.userId === me) fail('내 글에는 신청할 수 없습니다')

      const hours = num(b.hours, 1, 12, '시간')
      // 금액은 화면 값을 믿지 않고 서버에서 다시 센다
      const amount = listing!.pricePerHour * hours
      const meetMode = pick(b.meetMode, MODES, '진행 방식')

      await db.booking.create({
        data: {
          id: id(b.id, '예약'),
          listingId,
          memberId: me,
          hostId: listing!.userId,
          startAt: when(b.startAt, '시작 시각'),
          hours,
          amount,
          meetMode,
          pcbang: meetMode === 'ONLINE' ? null : (listing!.pcbang ?? null),
          checkInCode: `LM-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      })
      return
    }

    case 'booking.status': {
      const bookingId = id(p.bookingId, '예약')
      const status = pick(p.status, BOOKING_STATES, '상태')
      const booking = await db.booking.findUnique({ where: { id: bookingId } })
      if (!booking) fail('없는 예약입니다')
      if (!viewer.isAdmin && viewer.userId !== booking!.memberId && viewer.userId !== booking!.hostId)
        fail('권한이 없습니다')
      if (booking!.status === status) return

      // 약속 이행 지표는 상태가 바뀌는 순간에만 움직인다
      const bumps: { userId: string; field: 'kept' | 'noShow' | 'cancelLate' }[] = []
      if (status === 'COMPLETED') {
        bumps.push({ userId: booking!.hostId, field: 'kept' })
        bumps.push({ userId: booking!.memberId, field: 'kept' })
      }
      if (status === 'NO_SHOW') bumps.push({ userId: booking!.hostId, field: 'noShow' })
      if (status === 'CANCELLED' && booking!.status === 'CONFIRMED')
        bumps.push({ userId: booking!.memberId, field: 'cancelLate' })

      await db.$transaction([
        db.booking.update({ where: { id: bookingId }, data: { status } }),
        ...bumps.map((b) =>
          db.user.update({ where: { id: b.userId }, data: { [b.field]: { increment: 1 } } }),
        ),
      ])
      return
    }

    // ── 대화 ───────────────────────────────────────────────
    case 'message.send': {
      const me = requireLogin(viewer)
      const bookingId = id(p.bookingId, '예약')
      const body = text(p.body, 1000, '내용', 1)

      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        select: { memberId: true, hostId: true },
      })
      if (!booking) fail('없는 대화입니다')
      if (booking!.memberId !== me && booking!.hostId !== me) fail('권한이 없습니다')

      await db.message.create({
        data: { id: id(p.id, '메시지'), bookingId, senderId: me, body },
      })
      return
    }

    // ── 후기 ───────────────────────────────────────────────
    case 'review.add': {
      const me = requireLogin(viewer)
      const bookingId = id(p.bookingId, '예약')
      const rating = num(p.rating, 1, 5, '별점')
      const comment = text(p.comment, 500, '후기')

      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        select: { memberId: true, hostId: true, status: true },
      })
      if (!booking) fail('없는 예약입니다')
      if (booking!.memberId !== me && booking!.hostId !== me) fail('권한이 없습니다')
      if (booking!.status !== 'COMPLETED') fail('완료된 예약에만 후기를 쓸 수 있습니다')

      const targetId = booking!.memberId === me ? booking!.hostId : booking!.memberId
      const exists = await db.review.findUnique({
        where: { bookingId_authorId: { bookingId, authorId: me } },
      })
      if (exists) fail('이미 후기를 쓰셨습니다')

      await db.$transaction([
        db.review.create({
          data: { id: id(p.id, '후기'), bookingId, authorId: me, targetId, rating, comment },
        }),
        db.user.update({
          where: { id: targetId },
          data: { ratingSum: { increment: rating }, reviewCount: { increment: 1 } },
        }),
      ])
      return
    }

    // ── 운영 ───────────────────────────────────────────────
    case 'user.verify': {
      requireAdmin(viewer)
      await db.user.update({
        where: { id: id(p.userId, '회원') },
        data: { verified: Boolean(p.verified) },
      })
      return
    }

    case 'user.ban': {
      requireAdmin(viewer)
      const userId = id(p.userId, '회원')
      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { bannedAt: p.banned ? new Date() : null },
        }),
        // 정지되면 로그인 상태도 끊는다
        ...(p.banned ? [db.session.deleteMany({ where: { userId } })] : []),
      ])
      return
    }

    case 'user.delete': {
      requireAdmin(viewer)
      const userId = id(p.userId, '회원')
      // 글·예약·대화·후기는 관계에 걸어둔 대로 같이 지워진다
      await db.user.delete({ where: { id: userId } }).catch(() => {})
      return
    }

    case 'user.photoStatus': {
      requireAdmin(viewer)
      await db.user.update({
        where: { id: id(p.userId, '회원') },
        data: { photoStatus: pick(p.status, PHOTO_STATES, '사진 상태') },
      })
      return
    }

    // ── 정산 ───────────────────────────────────────────────
    case 'settlement.generate': {
      requireAdmin(viewer)
      const targets = await db.booking.findMany({
        where: { status: 'COMPLETED', settled: false, amount: { gt: 0 } },
        select: { id: true, hostId: true, amount: true },
      })
      if (targets.length === 0) return

      const byHost = new Map<string, { ids: string[]; gross: number }>()
      for (const b of targets) {
        const cur = byHost.get(b.hostId) ?? { ids: [], gross: 0 }
        cur.ids.push(b.id)
        cur.gross += b.amount
        byHost.set(b.hostId, cur)
      }

      await db.$transaction(
        [...byHost.entries()].map(([hostId, { ids, gross }]) => {
          const fee = Math.round(gross * FEE_RATE)
          return db.settlement.create({
            data: {
              id: `s-${hostId}-${Date.now().toString(36)}`.slice(0, 60),
              hostId,
              gross,
              fee,
              net: gross - fee,
              bookings: { connect: ids.map((bid) => ({ id: bid })) },
            },
          })
        }),
      )
      await db.booking.updateMany({
        where: { id: { in: targets.map((b) => b.id) } },
        data: { settled: true },
      })
      return
    }

    case 'settlement.pay': {
      requireAdmin(viewer)
      await db.settlement.update({
        where: { id: id(p.settlementId, '정산') },
        data: { status: 'PAID', paidAt: new Date() },
      })
      return
    }

    // ── 관리자 계정 ────────────────────────────────────────
    case 'admin.create': {
      requireAdmin(viewer)
      const username = text(p.username, 40, '아이디', 2)
      const password = String(p.password ?? '')
      if (password.length < 4) fail('비밀번호는 4자 이상으로 해주세요')
      if (await db.adminAccount.findUnique({ where: { username } }))
        fail('이미 있는 아이디입니다')

      await db.adminAccount.create({
        data: {
          id: id(p.id, '계정'),
          username,
          passwordHash: hashPassword(password),
          name: text(p.name, 40, '이름') || username,
        },
      })
      return
    }

    case 'admin.update': {
      requireAdmin(viewer)
      const adminId = id(p.adminId, '계정')
      const patch = (p.patch ?? {}) as Payload
      const target = await db.adminAccount.findUnique({ where: { id: adminId } })
      if (!target) fail('없는 계정입니다')

      const data: Record<string, unknown> = {}
      if ('name' in patch) data.name = text(patch.name, 40, '이름', 1)
      if ('active' in patch) {
        // 최고 관리자를 잠그면 아무도 못 들어온다
        if (target!.owner && !patch.active) fail('최고 관리자는 잠글 수 없습니다')
        data.active = Boolean(patch.active)
      }
      if (patch.password) {
        const pw = String(patch.password)
        if (pw.length < 4) fail('비밀번호는 4자 이상으로 해주세요')
        data.passwordHash = hashPassword(pw)
      }

      if (Object.keys(data).length === 0) return
      await db.adminAccount.update({ where: { id: adminId }, data })
      // 비밀번호를 바꿨으면 다른 곳에 남은 로그인은 끊는다
      if (data.passwordHash) await db.adminSession.deleteMany({ where: { adminId } })
      return
    }

    case 'admin.delete': {
      requireAdmin(viewer)
      const adminId = id(p.adminId, '계정')
      const target = await db.adminAccount.findUnique({ where: { id: adminId } })
      if (!target) return
      if (target!.owner) fail('최고 관리자는 삭제할 수 없습니다')
      await db.adminAccount.delete({ where: { id: adminId } })
      return
    }

    // ── 요금제 ─────────────────────────────────────────────
    case 'plan.update': {
      requireAdmin(viewer)
      const patch = (p.patch ?? {}) as Payload
      const data: Record<string, unknown> = {}
      if ('name' in patch) data.name = text(patch.name, 40, '이름', 1)
      if ('target' in patch) data.target = pick(patch.target, PLAN_TARGETS, '대상')
      if ('monthly' in patch) data.monthly = num(patch.monthly, 0, 10_000_000, '월 요금')
      if ('feeRate' in patch) {
        const rate = Number(patch.feeRate)
        if (!Number.isFinite(rate) || rate < 0 || rate > 1) fail('수수료율이 올바르지 않습니다')
        data.feeRate = rate
      }
      if ('features' in patch && Array.isArray(patch.features))
        data.features = patch.features.slice(0, 12).map((f) => String(f).slice(0, 60))
      if ('active' in patch) data.active = Boolean(patch.active)
      if ('note' in patch) data.note = text(patch.note, 200, '메모')

      if (Object.keys(data).length === 0) return
      await db.plan.update({ where: { id: id(p.planId, '요금제') }, data })
      return
    }

    default:
      fail('알 수 없는 요청입니다')
  }
}

/** 관리자 로그인은 쿠키를 건드려야 해서 별도 경로로 둔다 */
export async function adminSignIn(username: string, password: string) {
  const admin = await db.adminAccount.findUnique({ where: { username: username.trim() } })
  if (!admin || !admin.active) return null
  const { verifyPassword } = await import('./auth')
  if (!verifyPassword(password, admin.passwordHash)) return null

  const token = newToken()
  await db.$transaction([
    db.adminSession.create({ data: { token, adminId: admin.id, expiresAt: adminExpiry() } }),
    db.adminAccount.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
  ])
  return token
}
