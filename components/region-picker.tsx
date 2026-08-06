'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { REGIONS } from '@/lib/data'

export function RegionPicker() {
  const [region, setRegion] = useState(REGIONS[0])
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm text-muted transition hover:text-white"
      >
        <Icon name="location" className="size-4 text-brand-bright" />
        {region}
        <Icon name="chevronDown" className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <ul className="absolute top-8 left-0 z-20 w-56 overflow-hidden rounded-2xl border border-line bg-surface-2 py-1 shadow-2xl">
            {REGIONS.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => {
                    setRegion(r)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-surface-3 ${
                    r === region ? 'text-brand-bright' : 'text-muted'
                  }`}
                >
                  {r}
                  {r === region && <Icon name="check" className="size-4" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
