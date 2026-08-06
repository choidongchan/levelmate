'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Icon } from './icon'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const noSubscribe = () => () => {}

/** 이미 앱으로 설치돼 실행 중인지. 서버 렌더 시에는 true로 두어 깜빡임을 막는다. */
function useStandalone() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia('(display-mode: standalone)')
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(display-mode: standalone)').matches,
    () => true,
  )
}

function useIsIOS() {
  return useSyncExternalStore(
    noSubscribe,
    () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    () => false,
  )
}

/**
 * PC 바탕화면 / 모바일 홈화면 설치 안내.
 * 크롬·엣지는 beforeinstallprompt를 잡아 버튼 한 번으로 설치되고,
 * iOS 사파리는 이벤트가 없으므로 공유 버튼 안내 문구로 대신한다.
 */
export function InstallHint() {
  const standalone = useStandalone()
  const isIOS = useIsIOS()
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [justInstalled, setJustInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as InstallPromptEvent)
    }
    const onInstalled = () => {
      setJustInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (standalone || justInstalled) return null

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <Icon name="download" className="size-5 text-brand-bright" />
        <h2 className="text-sm font-bold">앱으로 설치하기</h2>
      </div>

      {deferred ? (
        <>
          <p className="mt-2 text-xs leading-relaxed text-dim">
            설치하면 바탕화면(또는 홈 화면) 아이콘으로 바로 열 수 있어요.
          </p>
          <button
            type="button"
            onClick={async () => {
              await deferred.prompt()
              const { outcome } = await deferred.userChoice
              if (outcome === 'accepted') setJustInstalled(true)
              setDeferred(null)
            }}
            className="mt-3 w-full rounded-2xl bg-brand py-3 text-sm font-semibold transition hover:bg-brand-bright active:scale-[0.99]"
          >
            바탕화면에 설치
          </button>
        </>
      ) : isIOS ? (
        <p className="mt-2 text-xs leading-relaxed text-dim">
          사파리 하단 공유 버튼 <span className="text-muted">⎋</span> → &lsquo;홈 화면에
          추가&rsquo;를 누르면 앱처럼 쓸 수 있어요.
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-dim">
          브라우저 주소창 오른쪽의 설치 아이콘, 또는 메뉴 → &lsquo;앱으로 설치&rsquo;를 누르면
          바탕화면에 아이콘이 생겨요.
        </p>
      )}
    </section>
  )
}
