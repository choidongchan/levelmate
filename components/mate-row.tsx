import Link from 'next/link'
import { GameChips, GameLine, WinBar } from './game-profile'
import { Icon } from './icon'
import { UserArt } from './user-art'
import { won } from '@/lib/format'
import { gameProfiles } from '@/lib/game-profile'
import { roleLabel, roleShort } from '@/lib/games'
import { ratingAvg } from '@/lib/promise-score'
import { GAMES, type Listing, type User } from '@/lib/types'

/**
 * 메이트 한 명.
 *
 * 두 가지 모양으로 그린다.
 *  - 바둑판: 사진이 큰 세로 타일. 눈으로 훑어보며 고를 때
 *  - 목록: 가로 한 줄. 게임마다 티어·자리·전적을 늘어놓아 조건으로 고를 때
 *
 * 화면 크기가 아니라 고른 보기 방식이 모양을 정한다. 휴대폰에서도 바둑판을
 * 볼 수 있어야 하고, 큰 화면에서도 목록으로 훑을 수 있어야 한다.
 *
 * 글이 없는 회원도 같은 줄로 보여준다. 가입만 하고 아직 글을 안 쓴 사람이
 * 아무 데도 안 보이면 서비스가 텅 비어 보인다.
 */
export function MateRow({
  user,
  listing,
  index = 0,
  href,
  view = 'grid',
}: {
  user: User
  /** 아직 글이 없는 회원이면 null */
  listing: Listing | null
  index?: number
  /** 기본은 메이트 프로필. 검색처럼 글이 주인공인 곳에서는 글로 보낸다 */
  href?: string
  view?: 'grid' | 'list'
}) {
  const rating = ratingAvg(user)
  const games = gameProfiles(user)
  // 글이 있으면 그 글의 게임을 앞세운다. 이 카드를 누른 이유가 그 게임이기 때문이다.
  const lead = listing
    ? (games.find((g) => g.game === listing.mainGame) ?? null)
    : (games[0] ?? null)
  const to = listing ? (href ?? `/users/${user.id}`) : `/users/${user.id}`

  // 이 글에서 찾는 자리. 글의 게임 줄에만 붙인다.
  const want = listing
    ? listing.wantRoles
        .map((r) => ({ key: r, label: roleLabel(listing.mainGame, r) }))
        .filter((r): r is { key: string; label: string } => !!r.label)
    : []

  const price = listing ? (
    <span className="text-sm font-bold text-brand-bright">
      {listing.pricePerHour === 0 ? (
        <span className="text-online">무료</span>
      ) : (
        <>
          {won(listing.pricePerHour)}
          <span className="text-[11px] font-medium text-dim">/시간</span>
        </>
      )}
    </span>
  ) : (
    <span className="text-[11px] font-medium text-dim">프로필 보기</span>
  )

  const stars = (
    <span className="inline-flex items-center gap-1 text-xs">
      <Icon name="star" className="size-3.5 text-star" />
      <span className="font-semibold tabular-nums">{rating?.toFixed(1) ?? '신규'}</span>
      {user.reviewCount > 0 && <span className="text-dim tabular-nums">({user.reviewCount})</span>}
    </span>
  )

  const name = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-semibold">{user.nickname}</span>
      {user.verified && <Icon name="shield" className="size-3 shrink-0 text-online" />}
      <span className="flex shrink-0 items-center gap-1 text-[10px]">
        <span className="online-dot size-1.5 rounded-full bg-online" />
        <span className="text-online">온라인</span>
      </span>
    </span>
  )

  // ─────────────────────── 목록형 ───────────────────────
  if (view === 'list') {
    return (
      <Link
        href={to}
        className="rise flex items-stretch gap-3 rounded-2xl bg-surface p-2.5 transition hover:bg-surface-2 active:scale-[0.99]"
        style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      >
        <UserArt
          user={user}
          className="aspect-[3/4] w-[4.75rem] shrink-0 rounded-xl"
          sizes="80px"
          priority={index < 5}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {name}

          {/* 연결한 게임을 전부, 게임마다 한 줄씩 */}
          {games.length > 0 ? (
            games.map((g) => (
              <GameLine key={g.game} game={g} want={g === lead ? want : undefined} />
            ))
          ) : (
            <SelfReported listing={listing} region={user.region} want={want} />
          )}

          <p className="truncate text-xs text-dim">
            {listing ? listing.title : user.intro || '아직 올린 글이 없어요'}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 pr-1">
          {stars}
          {price}
        </div>
      </Link>
    )
  }

  // ─────────────────────── 바둑판 ───────────────────────
  return (
    <Link
      href={to}
      className="rise flex flex-col overflow-hidden rounded-2xl bg-surface transition hover:bg-surface-2 active:scale-[0.99]"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <UserArt
        user={user}
        className="aspect-[3/4] w-full shrink-0"
        sizes="(max-width: 768px) 45vw, 260px"
        priority={index < 5}
      />

      <div className="flex min-w-0 flex-col gap-1 px-3 pt-2.5">
        {name}

        {lead ? (
          <>
            <p
              className="truncate text-[13px] leading-tight font-black"
              style={{ color: lead.tierColor }}
            >
              <span
                className="mr-1 rounded-[3px] px-1 py-0.5 align-middle text-[10px] font-black"
                style={{ background: `${lead.gameColor}2b`, color: lead.gameColor }}
              >
                {lead.gameShort}
              </span>
              {lead.tier ?? '언랭'}
              {lead.verified && (
                <Icon name="check" className="ml-1 inline size-3 align-middle text-online" />
              )}
            </p>
            {lead.record ? (
              <WinBar record={lead.record} />
            ) : (
              lead.detail && <p className="truncate text-[11px] text-dim">{lead.detail}</p>
            )}
          </>
        ) : (
          <SelfReported listing={listing} region={user.region} want={want} />
        )}

        {/* 다른 게임도 연결해뒀다면 전부 곁들인다 */}
        {games.length > 1 && <GameChips games={games.filter((g) => g !== lead)} max={3} />}

        <p className="truncate text-[11px] text-dim">
          {listing ? listing.title : user.intro || '아직 올린 글이 없어요'}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-1 px-3 pt-1.5 pb-3">
        {stars}
        {price}
      </div>
    </Link>
  )
}

/**
 * 계정을 아직 연결하지 않은 사람.
 * 직접 적은 값이라 게임사에서 가져온 것과 눈에 띄게 다르게, 흐린 글씨로 둔다.
 */
function SelfReported({
  listing,
  region,
  want,
}: {
  listing: Listing | null
  region: string
  want: { key: string; label: string }[]
}) {
  if (!listing) return <p className="truncate text-xs text-muted">{region}</p>

  const mine = roleShort(listing.mainGame, listing.myRole)
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
      <span className="truncate">
        {GAMES[listing.mainGame].short} · {listing.tier}
      </span>
      {mine && <span className="rounded bg-white/8 px-1 py-0.5 text-[10px] text-dim">{mine}</span>}
      {want.length > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-dim">
          찾는 자리
          {want.map((w) => (
            <span key={w.key} className="rounded bg-brand/15 px-1.5 py-0.5 font-bold text-brand-bright">
              {w.label}
            </span>
          ))}
        </span>
      )}
    </p>
  )
}
