import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { readViewer } from '@/lib/server/auth'
import {
  BlizzardError,
  d3Stats,
  lookupD3,
  lookupWow,
  wowStats,
} from '@/lib/server/blizzard'
import {
  fconlineStats,
  lookupFconline,
  lookupMaple,
  lookupSudden,
  mapleStats,
  NexonError,
  suddenStats,
} from '@/lib/server/nexon'
import {
  DEFAULT_PUBG_PLATFORM,
  getRankedStats,
  lookupPlayer,
  PUBG_PLATFORMS,
  PubgError,
  SYNC_COOLDOWN_MS,
} from '@/lib/server/pubg'
import { buildSnapshot } from '@/lib/server/snapshot'
import type { GameKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * 라이엇 말고 다른 게임의 계정 연결.
 *
 * 게임마다 부르는 곳이 다르지만 하는 일은 같다 — 이름으로 찾고, 전적을
 * 가져오고, DB 에 담는다. 그래서 다른 점만 아래 표에 적어두고 나머지
 * 흐름은 한 벌로 쓴다. 게임이 늘면 여기에 한 줄만 더하면 된다.
 *
 * 라이엇(롤)만 따로 두었다. 본인 인증 코드가 있어 흐름이 다르다.
 */

type Found = { id: string; name: string }
type Stats = {
  tier: string | null
  detail: string | null
  stats: Record<string, number | string> | null
}

type Provider = {
  /** 계정을 어느 쪽에 만들었는지 골라야 하는 게임만 */
  platforms?: readonly string[]
  defaultPlatform?: string
  /** 와우의 서버처럼, 목록으로 못 주고 직접 적어야 하는 값 */
  freePlatform?: boolean
  /** 못 찾았을 때 사람에게 보여줄 말 */
  notFound: string
  lookup(name: string, platform: string): Promise<Found | null>
  /** 갱신할 때 쓴다. 와우는 이름으로만 다시 부를 수 있어 이름도 받는다. */
  stats(externalId: string, platform: string, name: string): Promise<Stats>
}

const PROVIDERS: Partial<Record<GameKey, Provider>> = {
  pubg: {
    platforms: PUBG_PLATFORMS.map((p) => p.key),
    defaultPlatform: DEFAULT_PUBG_PLATFORM,
    notFound: '그런 배그 계정을 찾지 못했습니다. 닉네임과 플랫폼(카카오/스팀)을 확인해주세요.',
    lookup: (name, platform) => lookupPlayer(name, platform),
    stats: (id, platform) => getRankedStats(id, platform),
  },
  fconline: {
    notFound: '그런 FC 온라인 구단을 찾지 못했습니다. 감독명을 확인해주세요.',
    lookup: (name) => lookupFconline(name),
    stats: (id) => fconlineStats(id),
  },
  maple: {
    notFound: '그런 메이플 캐릭터를 찾지 못했습니다. 캐릭터명을 확인해주세요.',
    lookup: (name) => lookupMaple(name),
    stats: (id) => mapleStats(id),
  },
  sudden: {
    notFound: '그런 서든어택 계정을 찾지 못했습니다. 닉네임을 확인해주세요.',
    lookup: (name) => lookupSudden(name),
    stats: (id) => suddenStats(id),
  },
  wow: {
    // 서버가 수십 개라 목록으로 못 준다. 직접 적게 하고 블리자드 표로 맞춘다.
    freePlatform: true,
    notFound: '그런 와우 캐릭터를 찾지 못했습니다. 서버 이름과 캐릭터명을 확인해주세요.',
    lookup: (name, realm) => lookupWow(name, realm),
    stats: (id, _platform, name) => wowStats(id, name),
  },
  d3: {
    notFound: '그런 배틀태그를 찾지 못했습니다. 이름#1234 형태로 넣어주세요.',
    lookup: (name) => lookupD3(name),
    stats: (id) => d3Stats(id),
  },
}

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

  const game = String(body.game ?? '') as GameKey
  const provider = PROVIDERS[game]
  if (!provider) return fail('아직 연동하지 않은 게임입니다', 400)

  try {
    switch (String(body.op ?? '')) {
      case 'link':
        return await link(userId, game, provider, String(body.name ?? ''), String(body.platform ?? ''))
      case 'sync':
        return await sync(userId, game, provider)
      case 'unlink':
        await db.gameAccount.deleteMany({ where: { userId, game } })
        return ok()
      default:
        return fail('알 수 없는 요청입니다', 400)
    }
  } catch (err) {
    if (err instanceof PubgError || err instanceof NexonError || err instanceof BlizzardError) {
      return fail(err.message, 400)
    }
    console.error('[api/game]', game, body.op, err)
    return fail('처리하지 못했습니다', 500)
  }
}

async function ok() {
  return Response.json({ state: await buildSnapshot() })
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status })
}

/** 게임이 요구하면 고른 값을, 아니면 기본값을 쓴다 */
function platformOf(provider: Provider, raw: string) {
  if (provider.freePlatform) return raw.trim() || null
  if (!provider.platforms) return null
  return provider.platforms.includes(raw) ? raw : (provider.defaultPlatform ?? null)
}

async function link(
  userId: string,
  game: GameKey,
  provider: Provider,
  rawName: string,
  rawPlatform: string,
) {
  const name = rawName.trim()
  if (!name) return fail('게임 닉네임을 입력해주세요', 400)

  const platform = platformOf(provider, rawPlatform)
  const player = await provider.lookup(name, platform ?? '')
  if (!player) return fail(provider.notFound, 400)

  // 한 계정을 여러 사람이 걸어둘 수 없다. 그러면 전적을 빌려 쓸 수 있다.
  const taken = await db.gameAccount.findUnique({
    where: { game_externalId: { game, externalId: player.id } },
  })
  if (taken && taken.userId !== userId) {
    return fail('이미 다른 회원이 연결한 계정입니다.', 400)
  }

  const found = await provider.stats(player.id, platform ?? '', player.name)
  const data = {
    platform,
    name: player.name,
    externalId: player.id,
    tier: found.tier,
    detail: found.detail,
    stats: found.stats ?? Prisma.DbNull,
    syncedAt: new Date(),
  }

  await db.gameAccount.upsert({
    where: { userId_game: { userId, game } },
    create: { id: `ga-${game}-${userId}`.slice(0, 60), userId, game, ...data },
    update: data,
  })

  return ok()
}

async function sync(userId: string, game: GameKey, provider: Provider) {
  const row = await db.gameAccount.findUnique({ where: { userId_game: { userId, game } } })
  if (!row) return fail('먼저 계정을 연결해주세요', 400)

  if (row.syncedAt && Date.now() - row.syncedAt.getTime() < SYNC_COOLDOWN_MS) {
    const left = Math.ceil((SYNC_COOLDOWN_MS - (Date.now() - row.syncedAt.getTime())) / 60000)
    return fail(`방금 갱신했습니다. ${left}분 뒤에 다시 할 수 있어요.`, 400)
  }

  const found = await provider.stats(
    row.externalId,
    row.platform ?? provider.defaultPlatform ?? '',
    row.name,
  )
  await db.gameAccount.update({
    where: { userId_game: { userId, game } },
    data: {
      tier: found.tier,
      detail: found.detail,
      stats: found.stats ?? Prisma.DbNull,
      syncedAt: new Date(),
    },
  })
  return ok()
}
