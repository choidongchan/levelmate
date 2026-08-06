import Link from 'next/link'
import { Icon } from './icon'

export function ScreenHeader({ title, backHref = '/' }: { title: string; backHref?: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-ink/90 px-3 py-3 backdrop-blur">
      <Link
        href={backHref}
        aria-label="뒤로"
        className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-white"
      >
        <Icon name="chevronLeft" className="size-5" />
      </Link>
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  )
}
