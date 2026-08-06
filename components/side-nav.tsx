'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from './icon'
import { Logo } from './logo'
import { UserArt } from './user-art'
import { currentUser, useStore } from '@/lib/store'

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: '홈', icon: 'home' },
  { href: '/search', label: '찾기', icon: 'search' },
  { href: '/bookings', label: '예약', icon: 'calendar' },
  { href: '/chat', label: '채팅', icon: 'chat' },
  { href: '/my', label: '마이', icon: 'user' },
]

/** PC 전용 좌측 내비게이션. 모바일에서는 하단 탭이 대신한다. */
export function SideNav() {
  const pathname = usePathname()
  const state = useStore()
  const me = currentUser(state)

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-white/6 px-4 py-6 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <Logo className="size-8" />
        <span className="text-[19px] font-black tracking-tight">레벨메이트</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                active ? 'bg-white/10 font-bold text-white' : 'text-muted hover:bg-white/5'
              }`}
            >
              <Icon name={item.icon} className="size-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {me?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
              pathname.startsWith('/admin')
                ? 'bg-white/10 font-bold text-white'
                : 'text-muted hover:bg-white/5'
            }`}
          >
            <Icon name="shield" className="size-5 shrink-0" />
            관리자
          </Link>
        )}
      </nav>

      <Link
        href="/listings/new"
        className="brand-gradient mt-4 flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold transition active:scale-[0.99]"
      >
        <Icon name="plus" className="size-4" />
        글쓰기
      </Link>

      <div className="mt-auto">
        {me ? (
          <Link
            href="/my"
            className="flex items-center gap-2.5 rounded-2xl px-2 py-2 transition hover:bg-white/5"
          >
            <UserArt user={me} className="size-9 shrink-0 rounded-full" sizes="36px" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{me.nickname}</p>
              <p className="truncate text-[11px] text-dim">{me.region}</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center rounded-2xl bg-white/8 py-3 text-sm font-bold transition hover:bg-white/14"
          >
            로그인
          </Link>
        )}
      </div>
    </aside>
  )
}
