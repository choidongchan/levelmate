import { db } from '../db'
import { EMPTY_STATE, type State } from '../state'
import { readViewer, type Viewer } from './auth'
import { buildId } from './build'
import { keyStatus } from './riot'
import { getSetting, RIOT_KEY_OK } from './settings'
import {
  toAdmin,
  toBooking,
  toListing,
  toMessage,
  toPlan,
  toReview,
  toSettlement,
  toUser,
} from './shape'

/**
 * 화면 한 벌을 통째로 만들어 준다.
 *
 * 보는 사람에 따라 담기는 게 다르다.
 * - 남의 예약과 대화는 내려주지 않는다. 관리자만 전부 본다.
 * - 휴대폰 번호는 본인·관리자에게만 원문으로 간다.
 * - 내려지지 않은 글은 글쓴이와 관리자에게만 보인다.
 */
export async function buildSnapshot(viewer?: Viewer): Promise<State> {
  const who = viewer ?? (await readViewer())
  const { userId, adminId, isAdmin } = who

  const [userRows, listingRows, bookingRows, reviewRows, planRows] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'asc' }, include: { riot: true } }),
    db.listing.findMany({
      where: isAdmin ? {} : { OR: [{ active: true }, ...(userId ? [{ userId }] : [])] },
      orderBy: { createdAt: 'desc' },
    }),
    db.booking.findMany({
      where: isAdmin
        ? {}
        : userId
          ? { OR: [{ memberId: userId }, { hostId: userId }] }
          : { id: '' },
      orderBy: { createdAt: 'desc' },
    }),
    db.review.findMany({ orderBy: { createdAt: 'asc' } }),
    db.plan.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
  ])

  const bookingIds = bookingRows.map((b) => b.id)

  const [messageRows, settlementRows, adminRows] = await Promise.all([
    bookingIds.length
      ? db.message.findMany({
          where: { bookingId: { in: bookingIds } },
          orderBy: { createdAt: 'asc' },
        })
      : Promise.resolve([]),
    db.settlement.findMany({
      where: isAdmin ? {} : userId ? { hostId: userId } : { id: '' },
      orderBy: { createdAt: 'desc' },
      include: { bookings: { select: { id: true } } },
    }),
    isAdmin
      ? db.adminAccount.findMany({ orderBy: { createdAt: 'asc' } })
      : Promise.resolve([]),
  ])

  return {
    users: userRows.map((u) => toUser(u, isAdmin || u.id === userId, u.id === userId)),
    listings: listingRows.map(toListing),
    bookings: bookingRows.map(toBooking),
    messages: messageRows.map(toMessage),
    reviews: reviewRows.map(toReview),
    settlements: settlementRows.map(toSettlement),
    plans: planRows.map(toPlan),
    sessionUserId: userId,
    admins: adminRows.map(toAdmin),
    adminSessionId: adminId,
    loaded: true,
    build: await buildId(),
    riotKey: isAdmin ? await riotKeyState() : null,
  }
}

/** 키가 죽었는지. 관리자 메뉴에 빨간 표시를 띄우려고 본다. */
async function riotKeyState(): Promise<'ok' | 'bad' | 'none'> {
  const { set } = await keyStatus()
  if (!set) return 'none'
  return (await getSetting(RIOT_KEY_OK)) === '0' ? 'bad' : 'ok'
}

/**
 * DB 가 잠깐 안 되더라도 사이트가 통째로 죽으면 안 된다.
 * 빈 화면이라도 뜨게 두고, 브라우저가 /api/state 로 다시 받아 가게 한다.
 */
export async function safeSnapshot(): Promise<State> {
  try {
    return await buildSnapshot()
  } catch (err) {
    // Next 가 '이 화면은 요청마다 그려야 한다'고 알리는 신호는 삼키면 안 된다.
    // 삼키면 빈 화면이 그대로 굳어버린다.
    if (isFrameworkSignal(err)) throw err
    console.error('[snapshot] 실패 — 빈 화면으로 내려보냅니다', err)
    return { ...EMPTY_STATE, build: await buildId() }
  }
}

function isFrameworkSignal(err: unknown) {
  if (!err || typeof err !== 'object') return false
  const digest = String((err as { digest?: unknown }).digest ?? '')
  return digest.startsWith('DYNAMIC_SERVER_USAGE') || digest.startsWith('NEXT_')
}
