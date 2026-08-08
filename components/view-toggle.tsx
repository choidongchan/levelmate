'use client'

import { useSyncExternalStore } from 'react'
import { Icon } from './icon'

export type ListView = 'grid' | 'list'

const KEY = 'hp_list_view'

/**
 * 바둑판으로 볼지 목록으로 볼지.
 *
 * 사진을 보고 고르는 사람과 조건을 훑는 사람이 다르다. 한 번 고르면
 * 다음에 와도 그대로 보이게 브라우저에 적어둔다.
 */
let current: ListView | null = null
const listeners = new Set<() => void>()

function read(): ListView {
  if (current) return current
  try {
    const saved = localStorage.getItem(KEY)
    current = saved === 'list' ? 'list' : 'grid'
  } catch {
    current = 'grid'
  }
  return current
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useView(): [ListView, (v: ListView) => void] {
  // 서버는 무엇을 고를지 알 수 없으므로 바둑판으로 그린다.
  // 브라우저에서 저장된 값을 읽어 필요하면 갈아끼운다.
  const view = useSyncExternalStore(subscribe, read, () => 'grid' as ListView)

  const change = (v: ListView) => {
    current = v
    try {
      localStorage.setItem(KEY, v)
    } catch {
      // 저장을 막아둔 브라우저면 이번 화면에서만 바뀐다. 그래도 쓸 수 있다.
    }
    for (const fn of listeners) fn()
  }

  return [view, change]
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: ListView
  onChange: (v: ListView) => void
}) {
  return (
    <div className="ml-auto flex shrink-0 gap-0.5 rounded-full bg-white/6 p-0.5">
      {(
        [
          ['grid', '바둑판', 'grid'],
          ['list', '목록', 'list'],
        ] as const
      ).map(([key, label, icon]) => (
        <button
          key={key}
          type="button"
          aria-label={`${label}으로 보기`}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`grid size-7 place-items-center rounded-full transition ${
            value === key ? 'bg-white text-ink' : 'text-dim hover:text-white'
          }`}
        >
          <Icon name={icon} className="size-4" />
        </button>
      ))}
    </div>
  )
}
