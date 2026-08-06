'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from './icon'

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/search', label: '검색', icon: 'search' },
  { href: '/bookings', label: '예약', icon: 'calendar' },
  { href: '/chat', label: '채팅', icon: 'chat' },
  { href: '/my', label: '마이', icon: 'user' },
]

export function BottomNav() {
  const pathname = usePathname()

  // 관리자 콘솔은 자체 내비게이션을 쓴다
  if (pathname.startsWith('/admin')) return null


  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto max-w-md px-4">
        {/* 화면 폭을 꽉 채운 바 대신 떠 있는 알약 형태. 훨씬 가볍게 보인다. */}
        <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/10 bg-[#0d0d15]/85 px-2 py-1.5 shadow-[0_8px_32px_rgb(0_0_0/0.55)] backdrop-blur-xl">
          {TABS.map((tab) => {
            const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-medium transition ${
                  active ? 'text-white' : 'text-dim hover:text-muted'
                }`}
              >
                <span
                  className={`grid place-items-center rounded-full transition ${
                    active ? 'brand-gradient size-8 shadow-lg shadow-brand/40' : 'size-8'
                  }`}
                >
                  <Icon name={tab.icon} className="size-[18px]" />
                </span>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
