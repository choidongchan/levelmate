import Link from 'next/link'
import { GameBadge } from './game-badge'
import { Icon } from './icon'
import { ChampionList, RoleTag, TierBadge, WinRateBar } from './riot-badges'
import { UserArt } from './user-art'
import { won } from '@/lib/format'
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
}: {
  user: User
  /** 아직 글이 없는 회원이면 null */
  listing: Listing | null
  index?: number
  /** 기본은 메이트 프로필. 검색처럼 글이 주인공인 곳에서는 글로 보낸다 */
  href?: string
}) {
  const rating = ratingAvg(user)
  // 언랭이어도 연결했으면 보여준다. 주 포지션과 자주 하는 챔피언만으로도 고를 거리가 된다.
  const showRiot = Boolean(user.riot) && (!listing || listing.mainGame === 'lol')

  return (
    <Link
      href={listing ? (href ?? `/users/${user.id}`) : `/users/${user.id}`}
      className="rise flex items-stretch gap-3 overflow-hidden rounded-2xl bg-surface p-2.5 transition hover:bg-surface-2 active:scale-[0.99] md:flex-col md:gap-0 md:p-0"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <UserArt
        user={user}
        className="aspect-[3/4] w-[4.75rem] shrink-0 rounded-xl md:w-full md:rounded-none"
        sizes="(max-width: 768px) 80px, 260px"
        priority={index < 5}
      />

      {/* PC 는 한 줄에 여러 장이 들어가므로 글자를 조금 줄여 사진과 균형을 맞춘다 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center md:flex-none md:px-3 md:pt-2.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold md:text-sm">{user.nickname}</span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] md:text-[10px]">
            <span className="online-dot size-1.5 rounded-full bg-online" />
            <span className="text-online">온라인</span>
          </span>
        </div>

        {/* 롤이고 계정을 연결했으면 손으로 적은 티어 대신 실제 티어를 보여준다 */}
        {showRiot ? (
          <span className="mt-1 flex items-center gap-1.5">
            <TierBadge riot={user.riot!} />
            {user.riot!.mainRole && <RoleTag role={user.riot!.mainRole} />}
            <WinRateBar riot={user.riot!} />
          </span>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted md:text-[11px]">
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

        <p className="mt-1 truncate text-xs text-dim md:text-[11px]">
          {listing ? listing.title : user.intro || '아직 올린 글이 없어요'}
        </p>

        {showRiot && user.riot!.champions.length > 0 && (
          <span className="mt-1 hidden md:block">
            <ChampionList riot={user.riot!} />
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 pr-1 md:flex-row md:items-center md:justify-between md:gap-1 md:px-3 md:pt-1.5 md:pb-3">
        <span className="inline-flex items-center gap-1 text-xs md:text-[11px]">
          <Icon name="star" className="size-3.5 text-star" />
          <span className="font-semibold tabular-nums">{rating?.toFixed(1) ?? '신규'}</span>
          {user.reviewCount > 0 && (
            <span className="text-dim tabular-nums">({user.reviewCount})</span>
          )}
        </span>

        {listing ? (
          <span className="text-sm font-bold text-brand-bright md:text-[13px]">
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

        <div className="flex gap-1 md:hidden">
          {(listing?.games ?? []).slice(0, 3).map((g) => (
            <GameBadge key={g} game={g} />
          ))}
        </div>
      </div>
    </Link>
  )
}
