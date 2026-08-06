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
      <header className="sticky top-0 z-30 bg-ink/70 px-5 pt-4 pb-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-black tracking-tight">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
        <span className="glass grid size-16 place-items-center rounded-3xl">
          <Icon name={icon} className="size-7 text-brand-bright" />
        </span>
        <p className="mt-1 text-[15px] font-bold">{title} 화면은 준비 중이에요</p>
        <p className="text-xs leading-relaxed text-dim">{desc}</p>
      </main>
    </>
  )
}
