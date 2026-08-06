import { Icon, type IconName } from './icon'

export function ComingSoon({
  title,
  icon,
  desc,
}: {
  title: string
  icon: IconName
  desc: string
}) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface">
          <Icon name={icon} className="size-7 text-brand-bright" />
        </span>
        <p className="text-sm font-semibold">{title} 화면은 준비 중이에요</p>
        <p className="text-xs leading-relaxed text-dim">{desc}</p>
      </main>
    </>
  )
}
