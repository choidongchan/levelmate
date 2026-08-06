'use client'

import { useEffect } from 'react'
import { adoptInitialState, InitialStateContext, refresh, useNotice, showNotice } from '@/lib/store'
import type { State } from '@/lib/state'

/**
 * 서버가 그려 보낸 첫 데이터 한 벌을 화면 전체에 물려준다.
 *
 * 저장소에 담는 것은 브라우저에서만 한다. 서버에서 담으면
 * 요청끼리 모듈을 공유하기 때문에 다른 사람의 화면이 섞인다.
 */
export function StoreProvider({
  initial,
  children,
}: {
  initial: State
  children: React.ReactNode
}) {
  adoptInitialState(initial)

  return (
    <InitialStateContext.Provider value={initial}>
      {children}
      <Notice />
      <Revalidate loaded={initial.loaded} />
    </InitialStateContext.Provider>
  )
}

/** 서버가 데이터를 못 실어 보냈으면(DB 가 잠깐 안 됐다면) 브라우저에서 다시 받아온다. */
function Revalidate({ loaded }: { loaded: boolean }) {
  useEffect(() => {
    if (!loaded) void refresh()
  }, [loaded])
  return null
}

/** 실패했을 때 조용히 넘어가지 않게 알려준다. */
function Notice() {
  const message = useNotice()

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => showNotice(null), 4000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-28 z-[60] mx-auto max-w-sm md:bottom-8"
    >
      <button
        type="button"
        onClick={() => showNotice(null)}
        className="flex w-full items-center gap-2 rounded-2xl border border-[#f43f5e]/30 bg-[#1a0f16]/95 px-4 py-3 text-left text-xs leading-relaxed text-white shadow-lg backdrop-blur-xl"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#f43f5e]/20 text-[#f43f5e]">
          !
        </span>
        <span className="flex-1">{message}</span>
        <span className="shrink-0 text-dim">닫기</span>
      </button>
    </div>
  )
}
