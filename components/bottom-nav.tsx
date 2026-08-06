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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-[10px] transition ${
                active ? 'text-brand-bright' : 'text-dim hover:text-muted'
              }`}
            >
              <Icon name={tab.icon} className="size-5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
