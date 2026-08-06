import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: '채팅' }

export default function ChatPage() {
  return (
    <ComingSoon
      title="채팅"
      icon="chat"
      desc="개인 연락처 노출 없이 앱 안에서만 대화하도록 만들 예정입니다."
    />
  )
}
