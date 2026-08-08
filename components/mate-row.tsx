import Link from 'next/link'
import { GameBadge } from './game-badge'
import { GameChips, WinBar } from './game-profile'
import { Icon } from './icon'
import { UserArt } from './user-art'
import { won } from '@/lib/format'
import { gameProfiles } from '@/lib/game-profile'
import { roleShort } from '@/lib/games'
import { ratingAvg } from '@/lib/promise-score'
import { GAMES, type Listing, type User } from '@/lib/types'

/**
 * 추천 메이트 카드.
 *
 * 모바일은 가로형(왼쪽 세로 사진 + 오른쪽 정보), PC는 세로 카드로 전환해
 * 사진이 카드 폭을 가득 채우게 한다. 같은 컴포넌트로 두 형태를 만든다.
 *
 * 글이 없는 회원도 같은 카드로 보여준다. 가입만 하고 아직 글을 안 쓴 사람이
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
  /**
   * 바둑판(사진이 큰 카드) 또는 목록(한 줄에 하나).
   * 사진을 보고 고르는 사람과 조건을 훑는 사람이 다르다.
   */
  view?: 'grid' | 'list'
}) {
  const rating = ratingAvg(user)
  const games = gameProfiles(user)
  // 글이 있으면 그 글의 게임을 앞세운다. 이 카드를 누른 이유가 그 게임이기 때문이다.
  const lead = listing ? (games.find((g) => g.game === listing.mainGame) ?? null) : (games[0] ?? null)
  const rest = games.filter((g) => g !== lead)
  // 바둑판은 어느 화면에서나 사진이 큰 세로 카드, 목록은 어느 화면에서나
  // 가로 한 줄. 화면 크기가 아니라 고른 보기 방식이 모양을 정한다.
  const card = view === 'grid'
  const md = (classes: string) => (card ? classes : '')

  return (
    <Link
      href={listing ? (href ?? `/users/${user.id}`) : `/users/${user.id}`}
      className={`rise flex overflow-hidden rounded-2xl bg-surface transition hover:bg-surface-2 active:scale-[0.99] ${
        card ? 'flex-col' : 'items-stretch gap-3 p-2.5'
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <UserArt
        user={user}
        className={`aspect-[3/4] shrink-0 ${card ? 'w-full' : 'w-[4.75rem] rounded-xl'}`}
        sizes={card ? '(max-width: 768px) 45vw, 260px' : '80px'}
        priority={index < 5}
      />

      {/* PC 는 한 줄에 여러 장이 들어가므로 글자를 조금 줄여 사진과 균형을 맞춘다 */}
      <div className={`flex min-w-0 flex-1 flex-col justify-center ${md('flex-none px-3 pt-2.5')}`}>
        <div className="flex items-center gap-1.5">
          <span className={`truncate font-semibold ${md('text-sm')}`}>{user.nickname}</span>
          {user.verified && <Icon name="shield" className="size-3 shrink-0 text-online" />}
          <span className={`ml-auto flex shrink-0 items-center gap-1 text-[11px] ${md('text-[10px]')}`}>
            <span className="online-dot size-1.5 rounded-full bg-online" />
            <span className="text-online">온라인</span>
          </span>
        </div>

        {/* 게임사에서 가져온 등급이 있으면 그것을, 없으면 직접 적은 값을 보여준다 */}
        {lead ? (
          <>
            <p
              className={`mt-1 truncate text-sm leading-tight font-black ${md('text-[13px]')}`}
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
              <span className="mt-1 flex">
                <WinBar record={lead.record} />
              </span>
            ) : (
              lead.detail && (
                <p className="mt-0.5 truncate text-[11px] text-dim">{lead.detail}</p>
              )
            )}
          </>
        ) : (
          <p className={`mt-0.5 truncate text-xs text-muted ${md('text-[11px]')}`}>
            {listing ? (
              <>
                {GAMES[listing.mainGame].short} · {listing.tier}
                {roleShort(listing.mainGame, listing.myRole) && (
                  <span className="ml-1 rounded bg-white/8 px-1 py-0.5 text-[10px] text-dim">
                    {roleShort(listing.mainGame, listing.myRole)}
                  </span>
                )}
              </>
            ) : (
              user.region
            )}
          </p>
        )}

        {/* 다른 게임도 연결해뒀다면 전부 곁들인다. 모바일에서도 보인다. */}
        {rest.length > 0 && (
          <span className="mt-1 flex">
            <GameChips games={rest} max={3} />
          </span>
        )}

        <p className={`mt-1 truncate text-xs text-dim ${md('text-[11px]')}`}>
          {listing ? listing.title : user.intro || '아직 올린 글이 없어요'}
        </p>
      </div>

      <div className={`flex shrink-0 flex-col items-end justify-center gap-1.5 pr-1 ${md('flex-row items-center justify-between gap-1 px-3 pt-1.5 pb-3')}`}>
        <span className={`inline-flex items-center gap-1 text-xs ${md('text-[11px]')}`}>
          <Icon name="star" className="size-3.5 text-star" />
          <span className="font-semibold tabular-nums">{rating?.toFixed(1) ?? '신규'}</span>
          {user.reviewCount > 0 && (
            <span className="text-dim tabular-nums">({user.reviewCount})</span>
          )}
        </span>

        {listing ? (
          <span className={`text-sm font-bold text-brand-bright ${md('text-[13px]')}`}>
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
        )}

        <div className={`flex gap-1 ${card ? 'hidden' : ''}`}>
          {(listing?.games ?? []).slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>
    </Link>
  )
}
