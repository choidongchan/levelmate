import type { Metadata } from 'next'
import { Logo } from '@/components/logo'

export const metadata: Metadata = { title: '오프라인' }

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <Logo className="size-12" />
      <p className="text-sm font-semibold">네트워크에 연결되어 있지 않아요</p>
      <p className="text-xs leading-relaxed text-dim">
        PC방 인터넷 상태를 확인한 뒤 다시 시도해 주세요.
      </p>
    </main>
  )
}
