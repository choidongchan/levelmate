import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: '마이' }

export default function MyPage() {
  return (
    <ComingSoon
      title="마이"
      icon="user"
      desc="본인 인증, 정산 내역, 받은 후기, 신고·차단 관리가 들어갑니다."
    />
  )
}
