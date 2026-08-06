import Link from 'next/link'
import { Icon, type IconName } from '@/components/icon'
import { Logo } from '@/components/logo'
import { MateCard } from '@/components/mate-card'
import { RegionPicker } from '@/components/region-picker'
import { InstallHint } from '@/components/install-hint'
import {
  HOW_TO_STEPS,
  MATES,
  PARTNER_BENEFITS,
  PRODUCTS,
  SAFETY_ITEMS,
} from '@/lib/data'

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="text-lg font-bold tracking-tight">레벨메이트</span>
          </div>
          <Link
            href="/search"
            aria-label="검색"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-white"
          >
            <Icon name="search" className="size-5" />
          </Link>
        </div>
        <div className="mt-2">
          <RegionPicker />
        </div>
      </header>

      <main className="flex flex-col gap-8 px-4 pt-4">
        <HeroBanner />
        <ProductStrip />
        <RecommendedMates />
        <HowTo />
        <Safety />
        <PartnerCard />
        <InstallHint />
      </main>
    </>
  )
}

function HeroBanner() {
  return (
    <Link
      href="/search"
      className="relative flex items-center justify-between overflow-hidden rounded-3xl px-5 py-6 transition active:scale-[0.99]"
      style={{
        background: 'linear-gradient(115deg, #7c3aed 0%, #6d28d9 45%, #4c1d95 100%)',
      }}
    >
      <div>
        <p className="text-xs font-medium text-white/70">게임 친구가 필요할 때</p>
        <p className="mt-1.5 text-xl leading-snug font-bold">
          지금 바로
          <br />
          게임 메이트를 만나보세요!
        </p>
      </div>
      <Icon name="gamepad" className="size-14 shrink-0 text-white/25" />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full bg-white/10 blur-2xl"
      />
    </Link>
  )
}

function ProductStrip() {
  return (
    <section>
      <SectionTitle title="동행 상품" />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {PRODUCTS.map((p) => (
          <div
            key={p.id}
            className={`flex w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border p-4 text-center ${
              p.featured
                ? 'border-brand bg-brand/10 shadow-[0_0_24px_-6px] shadow-brand/60'
                : 'border-line bg-surface'
            }`}
          >
            <Icon
              name={p.icon as IconName}
              className={`size-7 ${p.featured ? 'text-brand-bright' : 'text-muted'}`}
            />
            <p className="text-sm font-semibold">{p.name}</p>
            <p className="text-[11px] text-dim">{p.desc}</p>
            <p className="mt-1 text-[13px] leading-tight font-bold text-brand-bright">
              {p.price}
              {p.unit && <span className="block text-[10px] font-medium text-dim">{p.unit}</span>}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecommendedMates() {
  return (
    <section>
      <SectionTitle
        title="추천 메이트"
        action={
          <Link href="/search" className="flex items-center gap-0.5 text-xs text-dim hover:text-muted">
            더보기
            <Icon name="chevronRight" className="size-3.5" />
          </Link>
        }
      />
      <div className="flex flex-col gap-2">
        {MATES.map((mate) => (
          <MateCard key={mate.id} mate={mate} />
        ))}
      </div>
    </section>
  )
}

function HowTo() {
  return (
    <section>
      <SectionTitle title="이용 방법" />
      <ol className="grid grid-cols-5 gap-1">
        {HOW_TO_STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col items-center gap-2 text-center">
            <span className="relative grid size-11 place-items-center rounded-full border border-line bg-surface">
              <Icon name={step.icon as IconName} className="size-5 text-brand-bright" />
              <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold">
                {i + 1}
              </span>
            </span>
            <span className="text-[11px] font-semibold">{step.title}</span>
            <span className="text-[10px] leading-tight whitespace-pre-line text-dim">
              {step.desc}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Safety() {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="text-base font-bold">안심하고 이용하세요!</h2>
      <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5">
        {SAFETY_ITEMS.map((item) => (
          <li key={item.title} className="flex flex-col items-center gap-1.5 text-center">
            <Icon name={item.icon as IconName} className="size-6 text-brand-bright" />
            <span className="text-xs font-semibold">{item.title}</span>
            <span className="text-[10px] leading-tight text-dim">{item.desc}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PartnerCard() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-brand/40 p-5"
      style={{ background: 'linear-gradient(150deg, #1a1030 0%, #120b22 60%, #0d0818 100%)' }}
    >
      <h2 className="text-base font-bold text-brand-bright">레벨업 PC방과 함께</h2>
      <p className="mt-1 text-xs text-muted">
        전국 레벨업 PC방에서 더 특별한 경험을!
      </p>
      <ul className="mt-4 grid gap-2">
        {PARTNER_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <Icon name="check" className="size-4 shrink-0 text-brand-bright" />
            {b}
          </li>
        ))}
      </ul>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-10 size-36 rounded-full bg-brand/20 blur-3xl"
      />
    </section>
  )
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
  )
}
