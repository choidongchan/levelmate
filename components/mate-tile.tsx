import Link from 'next/link'
import { Icon } from './icon'
import { MateArt } from './mate-art'
import { GAMES, type Mate } from '@/lib/data'
import { won } from '@/lib/format'

/** 홈·검색에서 쓰는 세로형 메이트 타일. */
export function MateTile({ mate, index = 0 }: { mate: Mate; index?: number }) {
  return (
    <Link
      href={`/mates/${mate.id}`}
      className="rise group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] transition duration-300 active:scale-[0.98]"
      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      <MateArt hue={mate.hue} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
      {/* 아래쪽만 진하게 눌러 글자를 읽히게 하고, 위쪽 색은 최대한 살린다 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-transparent" />

      <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between">
        {mate.online && (
          <span className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            <span className="online-dot size-1.5 rounded-full bg-online" />
            접속중
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold backdrop-blur">
          <Icon name="star" className="size-2.5 text-star" />
          {mate.rating.toFixed(1)}
        </span>
      </div>

      <div className="absolute inset-x-3 bottom-3">
        <p className="truncate text-[15px] leading-tight font-bold">{mate.nickname}</p>
        <p className="mt-0.5 truncate text-[11px] text-white/60">
          {GAMES[mate.mainGame].short} · {mate.tier}
        </p>
        <p className="mt-1.5 text-[13px] font-extrabold text-white">
          {won(mate.pricePerHour)}
          <span className="text-[10px] font-medium text-white/50"> /시간</span>
        </p>
      </div>
    </Link>
  )
}
