import type { Metadata } from 'next'
import { ComingSoon } from '@/components/coming-soon'

export const metadata: Metadata = { title: '예약' }

export default function BookingsPage() {
  return (
    <ComingSoon
      title="예약"
      icon="calendar"
      desc="예약 신청·결제·PC방 QR 체크인이 이 화면에 들어갑니다."
    />
  )
}
