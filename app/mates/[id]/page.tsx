import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GameBadge } from '@/components/game-badge'
import { Icon } from '@/components/icon'
import { MateArt } from '@/components/mate-art'
import { GAMES, MATES, getMate } from '@/lib/data'
import { won } from '@/lib/format'

export function generateStaticParams() {
  return MATES.map((m) => ({ id: m.id }))
}

export async function generateMetadata(props: PageProps<'/mates/[id]'>) {
  const { id } = await props.params
  const mate = getMate(id)
  if (!mate) return { title: '메이트 상세' }
  return {
    title: `${mate.nickname} 메이트`,
    description: `${GAMES[mate.mainGame].name} ${mate.tier} · ${mate.headline}`,
  }
}

export default async function MateDetailPage(props: PageProps<'/mates/[id]'>) {
  const { id } = await props.params
  const mate = getMate(id)
  if (!mate) notFound()

  return (
    <>
      {/* 상단을 이미지로 꽉 채우고 그 위에 정보를 얹는다 */}
      <section className="relative">
        <MateArt hue={mate.hue} className="h-[26rem] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />

        <Link
          href="/"
          aria-label="뒤로"
          className="absolute top-4 left-4 grid size-9 place-items-center rounded-full bg-black/40 backdrop-blur transition hover:bg-black/60"
        >
          <Icon name="chevronLeft" className="size-5" />
        </Link>

        <div className="absolute inset-x-5 bottom-5">
          {mate.online && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <span className="online-dot size-1.5 rounded-full bg-online" />
              지금 접속 중
            </span>
          )}
          <h1 className="mt-2 text-[28px] leading-tight font-black tracking-tight">
            {mate.nickname}
          </h1>
          <div className="mt-1.5 flex items-center gap-2.5 text-sm">
            <span className="text-muted">
              {GAMES[mate.mainGame].short} · {mate.tier}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="star" className="size-3.5 text-star" />
              <span className="font-bold">{mate.rating.toFixed(1)}</span>
              <span className="text-dim">({mate.reviewCount})</span>
            </span>
          </div>
        </div>
      </section>

      <main className="flex flex-col gap-4 px-5 pt-5">
        <p className="text-[15px] font-semibold">{mate.headline}</p>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="시간당" value={won(mate.pricePerHour)} highlight />
          <Stat label="응답률" value={`${mate.responseRate}%`} />
        </div>

        <dl className="glass flex flex-col gap-5 rounded-3xl p-5">
          <Row icon="clock" label="가능 시간">
            {mate.availableFrom} ~ {mate.availableTo}
          </Row>

          <Row icon="gamepad" label="주요 게임">
            <div className="flex flex-wrap gap-2">
              {mate.games.map((g) => (
                <GameBadge key={g} game={g} size="md" />
              ))}
            </div>
          </Row>

          <Row icon="monitor" label="동행 가능 PC방">
            {mate.pcbang}
          </Row>

          <Row icon="info" label="소개">
            <p className="leading-relaxed text-muted">{mate.bio}</p>
          </Row>
        </dl>

        {mate.verified && (
          <p className="flex items-center gap-2.5 rounded-3xl border border-online/20 bg-online/8 px-4 py-3.5 text-xs text-muted">
            <Icon name="shield" className="size-4 shrink-0 text-online" />
            본인 인증을 마친 메이트예요. 동행은 제휴 PC방에서만 진행됩니다.
          </p>
        )}
      </main>

      {/* 하단 탭 위에 뜨는 예약 바 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-30">
        <div className="mx-auto max-w-md px-5">
          <button
            type="button"
            className="brand-gradient pointer-events-auto flex w-full items-center justify-center gap-2 rounded-full py-4 text-[15px] font-bold shadow-[0_10px_30px_-6px] shadow-brand/70 transition active:scale-[0.99]"
          >
            {won(mate.pricePerHour)}에 예약하기
            <Icon name="arrowRight" className="size-4" />
          </button>
        </div>
      </div>
      <div className="h-8" aria-hidden />
    </>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="glass rounded-3xl px-4 py-3.5">
      <p className="text-[11px] text-dim">{label}</p>
      <p
        className={`mt-1 text-xl font-black tracking-tight ${highlight ? 'gradient-text' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: 'clock' | 'gamepad' | 'monitor' | 'info'
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3.5">
      <Icon name={icon} className="mt-0.5 size-[18px] shrink-0 text-brand-bright" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-dim">{label}</dt>
        <dd className="mt-1.5 text-sm">{children}</dd>
      </div>
    </div>
  )
}
