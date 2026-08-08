import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { readViewer } from '@/lib/server/auth'
import {
  DEFAULT_PUBG_PLATFORM,
  getRankedStats,
  lookupPlayer,
  PUBG_PLATFORMS,
  PubgError,
  SYNC_COOLDOWN_MS,
} from '@/lib/server/pubg'
import { buildSnapshot } from '@/lib/server/snapshot'

export const dynamic = 'force-dynamic'

/**
 * 라이엇 말고 다른 게임의 계정 연결.
 *
 * 지금은 배틀그라운드만. 게임이 늘어도 여기에 갈래만 하나씩 더 붙이면 된다.
 */
const GAMES = ['pubg'] as const

export async function POST(req: Request) {
  let body: { op?: unknown; game?: unknown; name?: unknown; platform?: unknown }
  try {
    body = await req.json()
  } catch {
    return fail('요청을 읽지 못했습니다', 400)
  }

  const viewer = await readViewer()
  if (!viewer.userId) return fail('로그인이 필요합니다', 401)
  const userId = viewer.userId

  const game = String(body.game ?? '')
  if (!GAMES.includes(game as (typeof GAMES)[number])) {
    return fail('아직 연동하지 않은 게임입니다', 400)
  }

  try {
    switch (String(body.op ?? '')) {
      case 'link':
        return await link(userId, String(body.name ?? ''), String(body.platform ?? ''))
      case 'sync':
        return await sync(userId)
      case 'unlink':
        await db.gameAccount.deleteMany({ where: { userId, game } })
        return ok()
      default:
        return fail('알 수 없는 요청입니다', 400)
    }
  } catch (err) {
    if (err instanceof PubgError) return fail(err.message, 400)
    console.error('[api/game]', body.op, err)
    return fail('처리하지 못했습니다', 500)
  }
}

async function ok() {
  return Response.json({ state: await buildSnapshot() })
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status })
}

async function link(userId: string, rawName: string, rawPlatform: string) {
  const name = rawName.trim()
  if (!name) return fail('배그 닉네임을 입력해주세요', 400)

  const platform = PUBG_PLATFORMS.some((p) => p.key === rawPlatform)
    ? rawPlatform
    : DEFAULT_PUBG_PLATFORM

  const player = await lookupPlayer(name, platform)
  if (!player) {
    return fail('그런 배그 계정을 찾지 못했습니다. 닉네임과 플랫폼(카카오/스팀)을 확인해주세요.', 400)
  }

  // 한 계정을 여러 사람이 걸어둘 수 없다. 그러면 전적을 빌려 쓸 수 있다.
  const taken = await db.gameAccount.findUnique({
    where: { game_externalId: { game: 'pubg', externalId: player.id } },
  })
  if (taken && taken.userId !== userId) {
    return fail('이미 다른 회원이 연결한 계정입니다.', 400)
  }

  const found = await getRankedStats(player.id, platform)

  await db.gameAccount.upsert({
    where: { userId_game: { userId, game: 'pubg' } },
    create: {
      id: `ga-pubg-${userId}`.slice(0, 60),
      userId,
      game: 'pubg',
      platform,
      name: player.name,
      externalId: player.id,
      tier: found.tier,
      detail: found.detail,
      stats: found.stats ?? Prisma.DbNull,
      syncedAt: new Date(),
    },
    update: {
      platform,
      name: player.name,
      externalId: player.id,
      tier: found.tier,
      detail: found.detail,
      stats: found.stats ?? Prisma.DbNull,
      syncedAt: new Date(),
    },
  })

  return ok()
}

async function sync(userId: string) {
  const row = await db.gameAccount.findUnique({
    where: { userId_game: { userId, game: 'pubg' } },
  })
  if (!row) return fail('먼저 배그 계정을 연결해주세요', 400)

  if (row.syncedAt && Date.now() - row.syncedAt.getTime() < SYNC_COOLDOWN_MS) {
    const left = Math.ceil((SYNC_COOLDOWN_MS - (Date.now() - row.syncedAt.getTime())) / 60000)
    return fail(`방금 갱신했습니다. ${left}분 뒤에 다시 할 수 있어요.`, 400)
  }

  const found = await getRankedStats(row.externalId, row.platform ?? DEFAULT_PUBG_PLATFORM)
  await db.gameAccount.update({
    where: { userId_game: { userId, game: 'pubg' } },
    data: {
      tier: found.tier,
      detail: found.detail,
      stats: found.stats ?? Prisma.DbNull,
      syncedAt: new Date(),
    },
  })
  return ok()
}
