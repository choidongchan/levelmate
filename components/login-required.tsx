'use client'

import { useRouter } from 'next/navigation'
import { Icon } from './icon'

export function LoginRequired({ next, desc }: { next: string; desc: string }) {
  const router = useRouter()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
      <span className="glass grid size-16 place-items-center rounded-3xl">
        <Icon name="id" className="size-7 text-brand-bright" />
      </span>
      <p className="mt-1 text-[15px] font-bold">로그인이 필요해요</p>
      <p className="text-xs leading-relaxed text-dim">{desc}</p>
      <button
        type="button"
        onClick={() => router.push(`/login?next=${encodeURIComponent(next)}`)}
        className="cta mt-2 rounded-full px-5 py-3 text-sm font-black"
      >
        로그인하기
      </button>
    </main>
  )
}
