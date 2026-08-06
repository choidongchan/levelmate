'use client'

import { useRouter } from 'next/navigation'
import { Icon } from './icon'

export function ScreenHeader({
  title,
  action,
  back = true,
}: {
  title: string
  action?: React.ReactNode
  back?: boolean
}) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-1.5 bg-ink/70 px-3 pt-4 pb-3 backdrop-blur-xl">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/8 hover:text-white"
        >
          <Icon name="chevronLeft" className="size-5" />
        </button>
      )}
      <h1 className={`text-[17px] font-black tracking-tight ${back ? '' : 'pl-2'}`}>{title}</h1>
      <div className="ml-auto pr-1">{action}</div>
    </header>
  )
}
