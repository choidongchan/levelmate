import { db } from '@/lib/db'
import { readViewer } from '@/lib/server/auth'
import {
  DEFAULT_PLATFORM,
  getRecentStats,
  getSoloRank,
  getSummoner,
  getThirdPartyCode,
  lookupRiotId,
  newVerifyCode,
  RiotError,
  SYNC_COOLDOWN_MS,
} from '@/lib/server/riot'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/**
 * 라이엇 계정 연결.
 *
 *   link   — "이름#태그" 로 계정을 찾아 연결하고 전적을 가져온다
 *   sync   — 전적을 다시 가져온다 (자주 부르지 못하게 쿨다운)
 *   verify — 게임 클라이언트에 넣은 코드로 본인 계정임을 확인한다
 *   unlink — 연결을 끊는다
 */
export async function POST(req: Request) {
  let body: { op?: unknown; gameName?: unknown; tagLine?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail('요청을 읽지 못했습니다', 400)
  }

  const viewer = await readViewer()
  if (!viewer.userId) return fail('로그인이 필요합니다', 401)
  const userId = viewer.userId

  try {
    switch (String(body.op ?? '')) {
      case 'link':
        return await link(userId, String(body.gameName ?? ''), String(body.tagLine ?? ''))
      case 'sync':
        return await sync(userId)
      case 'verify':
        return await verify(userId)
      case 'unlink':
        await db.riotAccount.deleteMany({ where: { userId } })
        return ok()
      default:
        return fail('알 수 없는 요청입니다', 400)
    }
  } catch (err) {
    if (err instanceof RiotError) return fail(err.message, 400)
    console.error('[api/riot]', body.op, err)
    return fail('처리하지 못했습니다', 500)
  }
}

async function ok(extra: Record<string, unknown> = {}) {
  return Response.json({ ...extra, state: await buildSnapshot() })
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status })
}

// ─────────────────────────── 연결 ───────────────────────────

async function link(userId: string, rawName: string, rawTag: string) {
  const gameName = rawName.trim()
  const tagLine = rawTag.trim().replace(/^#/, '')
  if (!gameName || !tagLine) {
    return fail('이름과 태그를 모두 입력해주세요 (예: 홍길동 #KR1)', 400)
  }

  const account = await lookupRiotId(gameName, tagLine)
  if (!account) return fail('그런 라이엇 계정을 찾지 못했습니다. 이름과 태그를 확인해주세요.', 400)

  // 한 계정을 여러 사람이 걸어둘 수 없다. 그러면 전적을 빌려 쓸 수 있다.
  const taken = await db.riotAccount.findUnique({ where: { puuid: account.puuid } })
  if (taken && taken.userId !== userId) {
    return fail('이미 다른 회원이 연결한 계정입니다.', 400)
  }

  const summoner = await getSummoner(account.puuid)

  await db.riotAccount.upsert({
    where: { userId },
    create: {
      id: `ra-${userId}`.slice(0, 60),
      userId,
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      platform: DEFAULT_PLATFORM,
      summonerId: summoner?.id ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
      verifyCode: newVerifyCode(),
    },
    update: {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerId: summoner?.id ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
      // 계정을 바꿔 걸면 본인 확인은 처음부터 다시 한다
      verifiedAt: null,
      verifyCode: newVerifyCode(),
    },
  })

  await pull(userId)
  return ok()
}

async function sync(userId: string) {
  const row = await db.riotAccount.findUnique({ where: { userId } })
  if (!row) return fail('먼저 라이엇 계정을 연결해주세요', 400)

  if (row.syncedAt && Date.now() - row.syncedAt.getTime() < SYNC_COOLDOWN_MS) {
    const left = Math.ceil(
      (SYNC_COOLDOWN_MS - (Date.now() - row.syncedAt.getTime())) / 60000,
    )
    return fail(`방금 갱신했습니다. ${left}분 뒤에 다시 할 수 있어요.`, 400)
  }

  await pull(userId)
  return ok()
}

/** 랭크와 최근 전적을 가져와 담는다 */
async function pull(userId: string) {
  const row = await db.riotAccount.findUnique({ where: { userId } })
  if (!row) return

  const [rank, recent] = await Promise.all([
    getSoloRank(row.puuid, row.summonerId, row.platform),
    getRecentStats(row.puuid, row.platform),
  ])

  await db.riotAccount.update({
    where: { userId },
    data: {
      tier: rank.tier,
      division: rank.division,
      lp: rank.lp,
      wins: rank.wins,
      losses: rank.losses,
      mainRole: recent.mainRole,
      champions: recent.champions,
      kills: recent.kills,
      deaths: recent.deaths,
      assists: recent.assists,
      recentGames: recent.recentGames,
      syncedAt: new Date(),
    },
  })
}

// ─────────────────────────── 본인 확인 ───────────────────────────

async function verify(userId: string) {
  const row = await db.riotAccount.findUnique({ where: { userId } })
  if (!row) return fail('먼저 라이엇 계정을 연결해주세요', 400)
  if (!row.summonerId) return fail('이 계정은 본인 확인을 할 수 없습니다.', 400)
  if (!row.verifyCode) return fail('확인 코드가 없습니다. 계정을 다시 연결해주세요.', 400)

  const entered = await getThirdPartyCode(row.summonerId, row.platform)
  if (!entered) {
    return fail('게임에서 코드를 아직 못 찾았습니다. 저장 후 잠시 뒤 다시 눌러주세요.', 400)
  }
  if (entered !== row.verifyCode) {
    return fail('코드가 다릅니다. 화면에 보이는 코드를 그대로 넣어주세요.', 400)
  }

  await db.riotAccount.update({ where: { userId }, data: { verifiedAt: new Date() } })
  return ok()
}
