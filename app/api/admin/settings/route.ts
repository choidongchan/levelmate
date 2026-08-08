import { readViewer } from '@/lib/server/auth'
import {
  blizzardKeyStatus,
  BlizzardError,
  checkBlizzardKey,
  d3Stats,
  lookupD3,
  lookupWow,
  wowStats,
} from '@/lib/server/blizzard'
import {
  checkKey,
  getRecentStats,
  getSoloRank,
  getSummoner,
  keyStatus,
  lookupRiotId,
  RiotError,
} from '@/lib/server/riot'
import {
  checkPubgKey,
  DEFAULT_PUBG_PLATFORM,
  getRankedStats,
  lookupPlayer,
  PUBG_PLATFORMS,
  pubgKeyStatus,
  PubgError,
} from '@/lib/server/pubg'
import {
  checkNexonKey,
  fconlineStats,
  lookupFconline,
  lookupMaple,
  lookupSudden,
  mapleStats,
  nexonKeyStatus,
  NexonError,
  suddenStats,
} from '@/lib/server/nexon'
import {
  BLIZZARD_ID,
  BLIZZARD_SECRET,
  maskSecret,
  NEXON_FC_KEY,
  NEXON_MAPLE_KEY,
  NEXON_SA_KEY,
  PUBG_KEY,
  RIOT_KEY,
  setSetting,
} from '@/lib/server/settings'
import { tierLabel } from '@/lib/riot'

/** 조회만 해보고 아무것도 저장하지 않는다 */
async function lookupPreview(gameName: string, tagLine: string) {
  const account = await lookupRiotId(gameName, tagLine)
  if (!account) {
    return { lookup: { kind: 'riot', ok: false, message: '그런 계정을 찾지 못했습니다.' } }
  }

  const summoner = await getSummoner(account.puuid)
  const [rank, recent] = await Promise.all([
    getSoloRank(account.puuid, summoner?.id ?? null),
    getRecentStats(account.puuid),
  ])

  return {
    lookup: {
      kind: 'riot',
      ok: true,
      name: `${account.gameName}#${account.tagLine}`,
      tier: tierLabel(rank.tier, rank.division),
      record: `${rank.wins}승 ${rank.losses}패`,
      lp: rank.lp,
      mainRole: recent.mainRole,
      champions: recent.champions.map((c) => `${c.name} ${c.games}판`).join(', ') || '없음',
      kda: `${recent.kills} / ${recent.deaths} / ${recent.assists} (${recent.recentGames}판)`,
      // 소환사 ID 가 안 오면 본인 인증을 쓸 수 없다. 그것도 여기서 보인다.
      canVerify: Boolean(summoner?.id),
    },
  }
}

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/**
 * 운영 설정.
 *
 * 비밀값은 원문을 절대 내보내지 않는다. 설정됐는지와 끝 네 글자만 알려준다.
 * .env 로 넣은 값이 있으면 그쪽이 우선이고, 화면에서는 바꿀 수 없다고 알린다.
 */
async function state() {
  const [riot, pubg, fc, maple, sa, bliz] = await Promise.all([
    keyStatus(),
    pubgKeyStatus(),
    nexonKeyStatus('fconline'),
    nexonKeyStatus('maple'),
    nexonKeyStatus('sudden'),
    blizzardKeyStatus(),
  ])
  const slot = (k: { set: boolean; source: 'env' | 'db' | null; value: string | null }) => ({
    set: k.set,
    source: k.source,
    masked: maskSecret(k.value),
  })
  return {
    riot: slot(riot),
    pubg: slot(pubg),
    fconline: slot(fc),
    maple: slot(maple),
    sudden: slot(sa),
    // 블리자드만 두 조각이라 비밀키가 들어있는지도 같이 알린다
    blizzard: { ...slot(bliz), hasSecret: bliz.hasSecret },
  }
}

export async function GET() {
  const viewer = await readViewer()
  if (!viewer.isAdmin) return Response.json({ error: '권한이 없습니다' }, { status: 403 })
  try {
    return Response.json(await state(), { headers: NO_STORE })
  } catch (err) {
    console.error('[api/admin/settings]', err)
    return Response.json({ error: '불러오지 못했습니다' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const viewer = await readViewer()
  if (!viewer.isAdmin) return Response.json({ error: '권한이 없습니다' }, { status: 403 })

  let body: { op?: unknown; value?: unknown; platform?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: '요청을 읽지 못했습니다' }, { status: 400 })
  }

  const op = String(body.op ?? '')

  try {
    switch (op) {
      case 'saveRiotKey': {
        const value = String(body.value ?? '').trim()
        if (value && !/^RGAPI-[A-Za-z0-9-]{8,60}$/.test(value)) {
          return Response.json(
            { error: '키 형태가 아닙니다. RGAPI- 로 시작하는 값을 넣어주세요.' },
            { status: 400 },
          )
        }
        await setSetting(RIOT_KEY, value || null)
        const test = value ? await checkKey() : { ok: false, message: '키를 지웠습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
      }
      case 'testRiotKey':
        return Response.json({ ...(await state()), test: await checkKey() }, { headers: NO_STORE })

      case 'savePubgKey': {
        const value = String(body.value ?? '').trim()
        // 배그 키는 JWT 라 점 두 개로 나뉜 긴 문자열이다.
        if (value && !/^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/.test(value)) {
          return Response.json(
            { error: '키 형태가 아닙니다. developer.pubg.com 에서 받은 값을 그대로 넣어주세요.' },
            { status: 400 },
          )
        }
        await setSetting(PUBG_KEY, value || null)
        const test = value ? await checkPubgKey() : { ok: false, message: '키를 지웠습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
      }
      // 넥슨은 게임마다 애플리케이션이 달라 키도 따로 받는다.
      case 'saveFconlineKey':
      case 'saveMapleKey':
      case 'saveSuddenKey': {
        const which =
          op === 'saveMapleKey' ? 'maple' : op === 'saveSuddenKey' ? 'sudden' : 'fconline'
        const value = String(body.value ?? '').trim()
        // 넥슨 키는 test_ 또는 live_ 로 시작하는 긴 문자열이다.
        if (value && !/^(test|live)_[A-Za-z0-9]{16,}$/.test(value)) {
          return Response.json(
            { error: '키 형태가 아닙니다. openapi.nexon.com 에서 받은 값을 그대로 넣어주세요.' },
            { status: 400 },
          )
        }
        const slotKey =
          which === 'maple' ? NEXON_MAPLE_KEY : which === 'sudden' ? NEXON_SA_KEY : NEXON_FC_KEY
        await setSetting(slotKey, value || null)
        const test = value ? await checkNexonKey(which) : { ok: false, message: '키를 지웠습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
      }
      // 블리자드는 아이디와 비밀키를 따로 저장한다.
      case 'saveBlizzardId':
      case 'saveBlizzardSecret': {
        const value = String(body.value ?? '').trim()
        if (value && !/^[A-Za-z0-9]{16,64}$/.test(value)) {
          return Response.json(
            { error: '형태가 아닙니다. develop.battle.net 에서 받은 값을 그대로 넣어주세요.' },
            { status: 400 },
          )
        }
        await setSetting(op === 'saveBlizzardId' ? BLIZZARD_ID : BLIZZARD_SECRET, value || null)
        const now = await blizzardKeyStatus()
        // 둘 다 있어야 확인할 수 있다. 하나만 넣은 상태에서는 조용히 넘어간다.
        const test = now.set
          ? await checkBlizzardKey()
          : { ok: false, message: '아이디와 비밀키를 둘 다 넣어야 확인할 수 있습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
      }
      case 'testBlizzardKey':
        return Response.json(
          { ...(await state()), test: await checkBlizzardKey() },
          { headers: NO_STORE },
        )

      // 와우·디아3 도 저장 없이 조회만 해본다.
      case 'lookupBlizzard': {
        const raw = String(body.value ?? '').trim()
        const realm = String(body.platform ?? '').trim()
        const d3 = raw.includes('#') || raw.includes('-')
        if (!raw) return Response.json({ error: '닉네임을 넣어주세요' }, { status: 400 })

        const player = d3 ? await lookupD3(raw) : await lookupWow(raw, realm)
        if (!player) {
          return Response.json(
            {
              lookup: {
                kind: 'blizzard',
                ok: false,
                message: d3
                  ? '그런 배틀태그를 찾지 못했습니다.'
                  : '그런 와우 캐릭터를 찾지 못했습니다. 서버 이름을 확인해주세요.',
              },
            },
            { headers: NO_STORE },
          )
        }
        const found = d3 ? await d3Stats(player.id) : await wowStats(player.id, player.name)
        return Response.json(
          {
            lookup: {
              kind: 'blizzard',
              ok: true,
              name: player.name,
              tier: found.tier ?? '등급 없음',
              record: found.detail ?? '기록 없음',
              kda: found.stats ? JSON.stringify(found.stats) : '없음',
            },
          },
          { headers: NO_STORE },
        )
      }

      case 'testFconlineKey':
        return Response.json(
          { ...(await state()), test: await checkNexonKey('fconline') },
          { headers: NO_STORE },
        )
      case 'testMapleKey':
        return Response.json(
          { ...(await state()), test: await checkNexonKey('maple') },
          { headers: NO_STORE },
        )
      case 'testSuddenKey':
        return Response.json(
          { ...(await state()), test: await checkNexonKey('sudden') },
          { headers: NO_STORE },
        )

      // 넥슨 두 게임도 저장 없이 조회만 해본다.
      case 'lookupNexon': {
        const raw = String(body.value ?? '').trim()
        const which = String(body.platform ?? 'fconline')
        if (!raw) return Response.json({ error: '닉네임을 넣어주세요' }, { status: 400 })

        const player =
          which === 'maple'
            ? await lookupMaple(raw)
            : which === 'sudden'
              ? await lookupSudden(raw)
              : await lookupFconline(raw)
        if (!player) {
          const what =
            which === 'maple' ? '메이플 캐릭터' : which === 'sudden' ? '서든어택 계정' : 'FC 온라인 구단'
          return Response.json(
            { lookup: { kind: 'nexon', ok: false, message: `그런 ${what}을 찾지 못했습니다.` } },
            { headers: NO_STORE },
          )
        }
        const found =
          which === 'maple'
            ? await mapleStats(player.id)
            : which === 'sudden'
              ? await suddenStats(player.id)
              : await fconlineStats(player.id)
        return Response.json(
          {
            lookup: {
              kind: 'nexon',
              ok: true,
              name: player.name,
              tier: found.tier ?? '등급 없음',
              record: found.detail ?? '기록 없음',
              kda: found.stats ? JSON.stringify(found.stats) : '없음',
            },
          },
          { headers: NO_STORE },
        )
      }

      case 'testPubgKey':
        return Response.json({ ...(await state()), test: await checkPubgKey() }, { headers: NO_STORE })

      // 배그 계정도 저장 없이 조회만 해본다.
      case 'lookupPubg': {
        const raw = String(body.value ?? '').trim()
        const platform = PUBG_PLATFORMS.some((p) => p.key === String(body.platform ?? ''))
          ? String(body.platform)
          : DEFAULT_PUBG_PLATFORM
        if (!raw) return Response.json({ error: '배그 닉네임을 넣어주세요' }, { status: 400 })

        const player = await lookupPlayer(raw, platform)
        if (!player) {
          return Response.json(
            { lookup: { kind: 'pubg', ok: false, message: '그런 배그 계정을 찾지 못했습니다.' } },
            { headers: NO_STORE },
          )
        }
        const found = await getRankedStats(player.id, platform)
        return Response.json(
          {
            lookup: {
              kind: 'pubg',
              ok: true,
              name: player.name,
              tier: found.tier ?? '랭크 없음',
              record: found.detail ?? '이번 시즌 기록 없음',
              kda: found.stats
                ? `KDA ${found.stats.kda} · 평균 딜 ${found.stats.avgDamage} · 승률 ${found.stats.winRate}%`
                : '없음',
            },
          },
          { headers: NO_STORE },
        )
      }

      // 아무 계정이나 조회만 해본다. 저장하지 않고, 누구에게도 붙이지 않는다.
      // 랭크가 있는 계정에서 티어가 제대로 나오는지 확인하려는 용도다.
      case 'lookupRiot': {
        const raw = String(body.value ?? '').trim()
        const [name, tag] = raw.split('#')
        if (!name?.trim() || !tag?.trim()) {
          return Response.json(
            { error: '이름#태그 형태로 넣어주세요 (예: 개미마왕#KR1)' },
            { status: 400 },
          )
        }
        return Response.json(await lookupPreview(name.trim(), tag.trim()), { headers: NO_STORE })
      }
      default:
        return Response.json({ error: '알 수 없는 요청입니다' }, { status: 400 })
    }
  } catch (err) {
    // 관리자만 보는 화면이라, 넥슨이 실제로 뭐라고 했는지까지 그대로 넘긴다.
    if (err instanceof BlizzardError) {
      const error = err.detail ? `${err.message} (${err.detail})` : err.message
      return Response.json({ error }, { status: 400 })
    }
    if (err instanceof NexonError) {
      const error = err.detail ? `${err.message} (${err.detail})` : err.message
      return Response.json({ error }, { status: 400 })
    }
    if (err instanceof RiotError || err instanceof PubgError) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('[api/admin/settings]', body.op, err)
    return Response.json({ error: '처리하지 못했습니다' }, { status: 500 })
  }
}
