'use client'

import { useEffect } from 'react'

/**
 * 서비스 워커 등록만 담당한다.
 * PC 크롬/엣지에서 "앱으로 설치"(바탕화면 바로가기)가 뜨려면
 * manifest 외에 fetch 핸들러를 가진 서비스 워커가 필요하다.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // 등록 실패해도 앱 사용에는 지장이 없으므로 조용히 넘어간다.
      })
  }, [])

  return null
}
