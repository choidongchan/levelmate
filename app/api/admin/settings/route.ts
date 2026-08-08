import { readViewer } from '@/lib/server/auth'
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
  mapleStats,
  nexonKeyStatus,
  NexonError,
} from '@/lib/server/nexon'
import {
  maskSecret,
  NEXON_FC_KEY,
  NEXON_MAPLE_KEY,
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
  const [riot, pubg, fc, maple] = await Promise.all([
    keyStatus(),
    pubgKeyStatus(),
    nexonKeyStatus('fconline'),
    nexonKeyStatus('maple'),
  ])
  const slot = (k: { set: boolean; source: 'env' | 'db' | null; value: string | null }) => ({
    set: k.set,
    source: k.source,
    masked: maskSecret(k.value),
  })
  return { riot: slot(riot), pubg: slot(pubg), fconline: slot(fc), maple: slot(maple) }
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
      case 'saveMapleKey': {
        const maple = op === 'saveMapleKey'
        const value = String(body.value ?? '').trim()
        // 넥슨 키는 test_ 또는 live_ 로 시작하는 긴 문자열이다.
        if (value && !/^(test|live)_[A-Za-z0-9]{16,}$/.test(value)) {
          return Response.json(
            { error: '키 형태가 아닙니다. openapi.nexon.com 에서 받은 값을 그대로 넣어주세요.' },
            { status: 400 },
          )
        }
        await setSetting(maple ? NEXON_MAPLE_KEY : NEXON_FC_KEY, value || null)
        const test = value
          ? await checkNexonKey(maple ? 'maple' : 'fconline')
          : { ok: false, message: '키를 지웠습니다.' }
        return Response.json({ ...(await state()), test }, { headers: NO_STORE })
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

      // 넥슨 두 게임도 저장 없이 조회만 해본다.
      case 'lookupNexon': {
        const raw = String(body.value ?? '').trim()
        const maple = String(body.platform ?? '') === 'maple'
        if (!raw) return Response.json({ error: '닉네임을 넣어주세요' }, { status: 400 })

        const player = maple ? await lookupMaple(raw) : await lookupFconline(raw)
        if (!player) {
          return Response.json(
            {
              lookup: {
                kind: 'nexon',
                ok: false,
                message: maple
                  ? '그런 메이플 캐릭터를 찾지 못했습니다.'
                  : '그런 FC 온라인 구단을 찾지 못했습니다.',
              },
            },
            { headers: NO_STORE },
          )
        }
        const found = maple ? await mapleStats(player.id) : await fconlineStats(player.id)
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
