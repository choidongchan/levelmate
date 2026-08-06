'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon, type IconName } from '@/components/icon'
import { adminLogout, currentAdmin, useStore } from '@/lib/store'

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: '대시보드', icon: 'chart' },
  { href: '/admin/users', label: '회원', icon: 'users' },
  { href: '/admin/photos', label: '사진 검수', icon: 'image' },
  { href: '/admin/listings', label: '글', icon: 'list' },
  { href: '/admin/bookings', label: '예약', icon: 'calendar' },
  { href: '/admin/payments', label: '결제', icon: 'won' },
  { href: '/admin/settlements', label: '정산', icon: 'bolt' },
  { href: '/admin/plans', label: '요금제', icon: 'trophy' },
  { href: '/admin/stats', label: '통계', icon: 'grid' },
  { href: '/admin/accounts', label: '관리자 계정', icon: 'shield' },
]

/**
 * 관리자 콘솔은 이용자 화면과 완전히 분리한다.
 * 하단 탭·글쓰기 버튼 같은 이용자용 요소가 없고, 폭도 넓게 쓴다.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const state = useStore()
  const admin = currentAdmin(state)

  // 검수를 기다리는 사진이 있으면 메뉴에서 바로 보이게 한다
  const badges: Record<string, number> = {
    '/admin/photos': state.users.filter((u) => u.photoStatus === 'PENDING').length,
  }

  // 로그인 화면은 콘솔 껍데기 없이 그대로 보여준다
  if (pathname === '/admin/login') return <>{children}</>

  if (!admin) {
    return (
      <Gate
        title="관리자 로그인이 필요합니다"
        desc={'운영자 전용 콘솔입니다.\n아이디와 비밀번호로 로그인해주세요.'}
        action="로그인"
        onAction={() => router.push('/admin/login')}
      />
    )
  }

  return (
    <div className="flex min-h-dvh">
      {/* 관리자 사이드바 — 이용자 화면과 달리 항상 보인다 */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-[#0b0b12] px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-5 flex items-center gap-2 px-2">
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-sm font-black">
            관
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-black">한판 관리자</p>
            <p className="truncate text-[10px] text-dim">{admin.name}</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition ${
                  active ? 'bg-brand/20 font-bold text-brand-bright' : 'text-muted hover:bg-white/5'
                }`}
              >
                <Icon name={item.icon} className="size-4 shrink-0" />
                {item.label}
                {badges[item.href] > 0 && (
                  <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-black text-white">
                    {badges[item.href]}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-muted transition hover:bg-white/5"
          >
            <Icon name="home" className="size-4" />
            서비스 화면
          </Link>
          <button
            type="button"
            onClick={adminLogout}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-muted transition hover:bg-white/5"
          >
            <Icon name="logout" className="size-4" />
            로그아웃
          </button>
          {/* 컴퓨터마다 다른 것이 보일 때, 같은 버전을 보고 있는지 바로 확인한다 */}
          <p className="px-3 pt-1 pb-1 text-[10px] break-all text-dim">
            버전 {state.build || '확인 중'}
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* 좁은 화면용 상단 메뉴 */}
        <header className="sticky top-0 z-30 border-b border-line bg-[#0b0b12]/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-black">
              관
            </span>
            <span className="text-sm font-black">한판 관리자</span>
            <button
              type="button"
              onClick={adminLogout}
              aria-label="로그아웃"
              className="ml-auto grid size-8 place-items-center rounded-full text-dim transition hover:bg-white/8 hover:text-white"
            >
              <Icon name="logout" className="size-4" />
            </button>
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((item) => {
              const active =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${
                    active ? 'bg-brand font-bold text-white' : 'bg-white/5 text-muted'
                  }`}
                >
                  {item.label}
                  {badges[item.href] > 0 && (
                    <span className="ml-1 font-black text-brand-bright">
                      {badges[item.href]}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </header>

        <main className="px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  )
}

function Gate({
  title,
  desc,
  action,
  onAction,
}: {
  title: string
  desc: string
  action: string
  onAction: () => void
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-10 text-center">
      <span className="grid size-16 place-items-center rounded-3xl border border-line bg-surface">
        <Icon name="shield" className="size-7 text-brand-bright" />
      </span>
      <p className="mt-1 text-[15px] font-bold">{title}</p>
      <p className="text-xs leading-relaxed whitespace-pre-line text-dim">{desc}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 rounded-2xl bg-brand px-5 py-3 text-sm font-bold transition hover:bg-brand-bright"
      >
        {action}
      </button>
    </main>
  )
}
