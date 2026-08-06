'use client'

import { useEffect } from 'react'
import { hydrateStore } from '@/lib/store'

/** 저장된 데이터를 첫 렌더 이후에 불러온다 (서버/클라이언트 렌더 불일치 방지). */
export function StoreHydrator() {
  useEffect(() => {
    hydrateStore()
  }, [])
  return null
}
