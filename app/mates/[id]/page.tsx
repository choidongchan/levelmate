import { notFound } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { GameBadge } from '@/components/game-badge'
import { Icon } from '@/components/icon'
import { OnlineDot } from '@/components/online-dot'
import { ScreenHeader } from '@/components/screen-header'
import { Rating } from '@/components/stars'
import { GAMES, MATES, getMate } from '@/lib/data'
import { won } from '@/lib/format'

export function generateStaticParams() {
  return MATES.map((m) => ({ id: m.id }))
}

export async function generateMetadata(props: PageProps<'/mates/[id]'>) {
  const { id } = await props.params
  const mate = getMate(id)
  return { title: mate ? `${mate.nickname} 메이트` : '메이트 상세' }
}

export default async function MateDetailPage(props: PageProps<'/mates/[id]'>) {
  const { id } = await props.params
  const mate = getMate(id)
  if (!mate) notFound()

  return (
    <>
      <ScreenHeader title="메이트 상세" />

      <main className="flex flex-col gap-5 px-4 pt-4">
        <Avatar
          nickname={mate.nickname}
          hue={mate.hue}
          rounded="rounded-3xl"
          className="h-56 w-full text-6xl"
        />

        <section>
          <OnlineDot online={mate.online} />
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">{mate.nickname}</h1>
            <Rating value={mate.rating} count={mate.reviewCount} className="text-sm" />
          </div>
          <p className="mt-1 text-sm text-muted">
            {GAMES[mate.mainGame].short} · {mate.tier}
          </p>
          <p className="mt-2 text-sm text-dim">{mate.headline}</p>
        </section>

        <dl className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">
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

          <Row icon="bolt" label="응답률">
            {mate.responseRate}%
          </Row>

          <Row icon="info" label="소개">
            <p className="leading-relaxed">{mate.bio}</p>
          </Row>
        </dl>

        {mate.verified && (
          <p className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-xs text-muted">
            <Icon name="shield" className="size-4 shrink-0 text-brand-bright" />
            본인 인증을 마친 메이트예요. 동행은 제휴 PC방에서만 진행됩니다.
          </p>
        )}
      </main>

      {/* 예약 바 — 하단 탭 위에 붙는다 */}
      <div className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <div className="shrink-0">
            <p className="text-lg leading-tight font-bold text-brand-bright">
              {won(mate.pricePerHour)}
            </p>
            <p className="text-[11px] text-dim">시간당</p>
          </div>
          <button
            type="button"
            className="flex-1 rounded-2xl bg-brand py-3.5 text-sm font-bold transition hover:bg-brand-bright active:scale-[0.99]"
          >
            예약하기
          </button>
        </div>
      </div>
      <div className="h-20" aria-hidden />
    </>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: 'clock' | 'gamepad' | 'monitor' | 'info' | 'bolt'
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-brand-bright" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-dim">{label}</dt>
        <dd className="mt-1 text-sm">{children}</dd>
      </div>
    </div>
  )
}
