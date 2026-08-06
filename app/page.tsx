import Link from 'next/link'
import { Icon, type IconName } from '@/components/icon'
import { InstallHint } from '@/components/install-hint'
import { Logo } from '@/components/logo'
import { MateArt } from '@/components/mate-art'
import { MateTile } from '@/components/mate-tile'
import { RegionPicker } from '@/components/region-picker'
import { HOW_TO_STEPS, MATES, PARTNER_BENEFITS, PRODUCTS } from '@/lib/data'

export default function HomePage() {
  const online = MATES.filter((m) => m.online)

  return (
    <>
      <header className="sticky top-0 z-30 bg-ink/70 px-5 pt-4 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="text-[19px] font-black tracking-tight">레벨메이트</span>
          </div>
          <Link
            href="/search"
            aria-label="검색"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/8 hover:text-white"
          >
            <Icon name="search" className="size-[19px]" />
          </Link>
        </div>
        <div className="mt-2.5">
          <RegionPicker />
        </div>
      </header>

      <main className="flex flex-col gap-9 px-5 pt-3">
        <Hero onlineCount={online.length} />
        <OnlineStrip />
        <ProductStrip />
        <Recommended />
        <HowTo />
        <SafetyBar />
        <PartnerCard />
        <InstallHint />
        <Footer />
      </main>
    </>
  )
}

function Hero({ onlineCount }: { onlineCount: number }) {
  return (
    <Link
      href="/search"
      className="rise brand-gradient relative overflow-hidden rounded-[2rem] px-6 py-7 transition active:scale-[0.99]"
    >
      <p className="text-[11px] font-semibold tracking-wide text-white/70">
        게임 친구가 필요할 때
      </p>
      <h1 className="mt-2 text-[26px] leading-[1.25] font-black tracking-tight">
        지금 바로
        <br />
        게임 메이트를 만나요
      </h1>

      <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/25 py-1.5 pr-3 pl-2.5 text-xs font-semibold backdrop-blur">
        <span className="online-dot size-1.5 rounded-full bg-online" />
        지금 {onlineCount}명 접속 중
        <Icon name="arrowRight" className="size-3.5" />
      </span>

      <Icon
        name="gamepad"
        className="pointer-events-none absolute -right-3 bottom-3 size-28 text-white/15"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-white/15 blur-3xl"
      />
    </Link>
  )
}

function OnlineStrip() {
  const online = MATES.filter((m) => m.online)

  return (
    <section>
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5">
        {online.map((m, i) => (
          <Link
            key={m.id}
            href={`/mates/${m.id}`}
            className="rise flex w-16 shrink-0 flex-col items-center gap-1.5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* 접속 중인 메이트는 그라데이션 링으로 표시 */}
            <span className="brand-gradient grid size-16 place-items-center rounded-full p-[2px]">
              <MateArt hue={m.hue} className="size-full rounded-full border-2 border-ink" />
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted">
              {m.nickname}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ProductStrip() {
  return (
    <section>
      <SectionTitle title="동행 상품" />
      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className="glass flex w-[8.5rem] shrink-0 flex-col gap-2.5 rounded-3xl p-4"
            style={
              p.featured
                ? {
                    borderColor: `${p.accent}66`,
                    background: `linear-gradient(160deg, ${p.accent}22, rgb(255 255 255 / 0.04))`,
                  }
                : undefined
            }
          >
            <span
              className="grid size-9 place-items-center rounded-2xl"
              style={{ background: `${p.accent}1f`, color: p.accent }}
            >
              <Icon name={p.icon as IconName} className="size-[18px]" />
            </span>
            <div>
              <p className="text-[13px] font-bold">{p.name}</p>
              <p className="mt-0.5 text-[11px] text-dim">{p.desc}</p>
            </div>
            <p className="text-[13px] leading-tight font-extrabold" style={{ color: p.accent }}>
              {p.price}
              {p.unit && <span className="block text-[10px] font-medium text-dim">{p.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Recommended() {
  return (
    <section>
      <SectionTitle
        title="추천 메이트"
        action={
          <Link
            href="/search"
            className="flex items-center gap-0.5 text-xs text-dim transition hover:text-muted"
          >
            더보기
            <Icon name="chevronRight" className="size-3.5" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        {MATES.map((mate, i) => (
          <MateTile key={mate.id} mate={mate} index={i} />
        ))}
      </div>
    </section>
  )
}

function HowTo() {
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="text-[15px] font-bold">처음이신가요?</h2>
      <p className="mt-1 text-xs text-dim">5단계면 끝나요.</p>
      <ol className="mt-4 flex items-start justify-between gap-1">
        {HOW_TO_STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-1 flex-col items-center gap-2 text-center">
            <span className="relative grid size-10 place-items-center rounded-2xl bg-white/6">
              <Icon name={step.icon as IconName} className="size-[18px] text-brand-bright" />
              <span className="brand-gradient absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full text-[9px] font-bold">
                {i + 1}
              </span>
            </span>
            <span className="text-[10px] leading-tight font-medium">{step.title}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function SafetyBar() {
  return (
    <Link
      href="/my"
      className="glass flex items-center gap-3 rounded-3xl px-5 py-4 transition hover:bg-white/8"
    >
      <Icon name="shield" className="size-5 shrink-0 text-online" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold">본인 인증 · 제휴 PC방 · 안심 결제</p>
        <p className="mt-0.5 text-[11px] text-dim">
          연락처 노출 없이, 지정된 매장에서만 동행해요
        </p>
      </div>
      <Icon name="chevronRight" className="size-4 shrink-0 text-dim" />
    </Link>
  )
}

function PartnerCard() {
  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-white/8 p-6"
      style={{ background: 'linear-gradient(155deg, #1d1136 0%, #120c22 55%, #0a0714 100%)' }}
    >
      <p className="text-[11px] font-semibold tracking-wide text-brand-bright">PARTNER</p>
      <h2 className="mt-1.5 text-lg font-black tracking-tight">레벨업 PC방과 함께</h2>
      <p className="mt-1 text-xs text-muted">전국 레벨업 PC방에서 더 특별한 경험을</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {PARTNER_BENEFITS.map((b) => (
          <li
            key={b}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium"
          >
            {b}
          </li>
        ))}
      </ul>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -bottom-14 size-44 rounded-full bg-brand/25 blur-3xl"
      />
    </section>
  )
}

function Footer() {
  return (
    <footer className="pt-2 pb-4 text-center">
      <p className="text-[10px] leading-relaxed text-dim">
        레벨메이트는 게임 동행 매칭을 중개하는 플랫폼입니다.
        <br />
        동행은 제휴 PC방 내에서만 진행됩니다.
      </p>
    </footer>
  )
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="text-[17px] font-black tracking-tight">{title}</h2>
      {action}
    </div>
  )
}
