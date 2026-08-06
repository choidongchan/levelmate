'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './icon'

/** 카드·프로필 모두 세로형이라 3:4 로 담는다. */
const W = 720
const H = 960
const QUALITY = 0.85
const MAX_ZOOM = 6

/**
 * 사진 선택기.
 *
 * 파일을 고르면 바로 넣지 않고 편집 창을 띄운다.
 * 원본 비율을 그대로 두고 끌어서 옮기고 확대·축소해서
 * 3:4 칸을 꽉 채우게 맞춘 뒤 그 부분만 잘라 담는다.
 * 칸보다 작아지지 않게 막아두어 여백이나 찌그러짐이 생기지 않는다.
 *
 * 지금은 결과를 data URL 로 돌려주어 브라우저 저장소에 담는다.
 * 서버 업로드를 붙이면 이 컴포넌트는 그대로 두고 onPick 안에서
 * 올린 뒤 받은 주소를 넘기면 된다.
 */
export function PhotoPicker({
  value,
  nickname,
  onPick,
  onClear,
}: {
  value: string | null
  nickname: string
  onPick: (dataUrl: string) => void
  onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')

  // 편집 창을 닫을 때 임시 주소를 돌려준다
  useEffect(() => {
    if (!editing) return
    return () => URL.revokeObjectURL(editing)
  }, [editing])

  const choose = (file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다')
      return
    }
    setEditing(URL.createObjectURL(file))
  }

  return (
    <div className="rounded-xl bg-white/5 p-3">
      <span className="block text-[10px] text-dim">프로필 사진</span>

      <div className="mt-2 flex items-start gap-3">
        <div className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          {value ? (
            // 브라우저에서 만든 data URL 도 그대로 보여야 하므로 img 를 쓴다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${nickname} 프로필 사진`} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-[10px] text-dim">없음</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) choose(f)
              e.target.value = ''
            }}
          />

          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-[11px] font-bold transition hover:bg-brand-bright"
          >
            <Icon name="download" className="size-3.5 rotate-180" />
            {value ? '사진 바꾸기' : '사진 선택'}
          </button>

          {value && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg bg-white/8 py-2 text-[11px] font-bold transition hover:bg-white/14"
            >
              사진 제거 (캐릭터로)
            </button>
          )}

          <p className="text-[10px] leading-relaxed text-dim">
            고른 뒤 끌어서 옮기고 확대·축소해 칸을 꽉 채우면, 그 부분만 잘라 담습니다.
          </p>
          {error && <p className="text-[10px] text-[#f43f5e]">{error}</p>}
        </div>
      </div>

      {editing && (
        <CropEditor
          url={editing}
          onCancel={() => setEditing(null)}
          onApply={(dataUrl) => {
            onPick(dataUrl)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

type View = { zoom: number; x: number; y: number }

/** 끌어서 옮기고 확대·축소해서 3:4 칸에 맞추는 편집 창 */
function CropEditor({
  url,
  onCancel,
  onApply,
}: {
  url: string
  onCancel: () => void
  onApply: (dataUrl: string) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 칸 크기는 화면 폭에 따라 달라지므로 실제 크기를 재서 쓴다
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setFrame({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // 칸을 덮는 최소 배율. 여기서 더 작아지지 못하게 막아 여백이 안 생긴다
  const base = nat.w && frame.w ? Math.max(frame.w / nat.w, frame.h / nat.h) : 0
  const scale = base * view.zoom
  const dispW = nat.w * scale
  const dispH = nat.h * scale

  /** 칸 밖으로 빠져나가지 않게 위치를 가둔다 */
  const clamp = useCallback(
    (v: View): View => {
      const s = base * v.zoom
      const maxX = Math.max(0, (nat.w * s - frame.w) / 2)
      const maxY = Math.max(0, (nat.h * s - frame.h) / 2)
      return {
        zoom: v.zoom,
        x: Math.min(maxX, Math.max(-maxX, v.x)),
        y: Math.min(maxY, Math.max(-maxY, v.y)),
      }
    },
    [base, nat.w, nat.h, frame.w, frame.h],
  )

  /** 화면의 한 점을 붙잡은 채로 확대·축소한다 */
  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      setView((v) => {
        const next = Math.min(MAX_ZOOM, Math.max(1, v.zoom * factor))
        const f = next / v.zoom
        return clamp({ zoom: next, x: px - (px - v.x) * f, y: py - (py - v.y) * f })
      })
    },
    [clamp],
  )

  /** 두 손가락 또는 마우스 위치를 칸 중앙 기준 좌표로 바꾼다 */
  const toLocal = (e: { clientX: number; clientY: number }) => {
    const r = frameRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }
  }

  const centroid = () => {
    const list = [...pointers.current.values()]
    const x = list.reduce((a, p) => a + p.x, 0) / list.length
    const y = list.reduce((a, p) => a + p.y, 0) / list.length
    const dist =
      list.length < 2 ? 0 : Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y)
    return { x, y, dist }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    const before = centroid()
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const after = centroid()

    // 손가락 두 개면 벌린 만큼 확대, 한 개면 끌린 만큼 이동
    if (before.dist > 0 && after.dist > 0) {
      const p = toLocal({ clientX: after.x, clientY: after.y })
      zoomAt(after.dist / before.dist, p.x, p.y)
    }
    const dx = after.x - before.x
    const dy = after.y - before.y
    if (dx || dy) setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
  }

  const onWheel = (e: React.WheelEvent) => {
    const p = toLocal(e)
    zoomAt(Math.exp(-e.deltaY * 0.0015), p.x, p.y)
  }

  const apply = () => {
    const img = imgRef.current
    if (!img || !base) return
    setBusy(true)
    try {
      // 칸에 보이는 만큼만 원본 좌표로 되돌려 잘라낸다
      const sw = frame.w / scale
      const sh = frame.h / scale
      const sx = Math.min(nat.w - sw, Math.max(0, (nat.w - sw) / 2 - view.x / scale))
      const sy = Math.min(nat.h - sh, Math.max(0, (nat.h - sh) / 2 - view.y / scale))

      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
      onApply(canvas.toDataURL('image/webp', QUALITY))
    } catch {
      setError('사진을 처리하지 못했습니다. 다른 파일로 시도해주세요.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[22rem] flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">사진 편집</span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="편집 취소"
            className="grid size-9 place-items-center rounded-full bg-white/10 text-sm transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          className="relative aspect-[3/4] w-full touch-none overflow-hidden rounded-2xl bg-black select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt="편집할 사진"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget
              setNat({ w: el.naturalWidth, h: el.naturalHeight })
              setView({ zoom: 1, x: 0, y: 0 })
            }}
            style={
              base
                ? {
                    width: `${dispW}px`,
                    height: `${dispH}px`,
                    transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px))`,
                  }
                : { width: '100%', height: '100%', transform: 'translate(-50%, -50%)' }
            }
            className="absolute top-1/2 left-1/2 max-w-none cursor-grab object-cover active:cursor-grabbing"
          />

          {/* 잘릴 자리를 알려주는 안내선 */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/25 ring-inset" />

          <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-white/70">
            끌어서 옮기고, 두 손가락 또는 아래 버튼으로 확대
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-2">
          <button
            type="button"
            onClick={() => zoomAt(1 / 1.25, 0, 0)}
            aria-label="축소"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 text-base leading-none transition hover:bg-white/22"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            onChange={(e) =>
              setView((v) => clamp({ zoom: Number(e.target.value), x: v.x, y: v.y }))
            }
            aria-label="확대 비율"
            className="h-1 flex-1 accent-brand"
          />
          <button
            type="button"
            onClick={() => zoomAt(1.25, 0, 0)}
            aria-label="확대"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 text-base leading-none transition hover:bg-white/22"
          >
            +
          </button>
        </div>

        {error && <p className="text-[11px] text-[#f43f5e]">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={apply}
            disabled={busy || !base}
            className="flex-1 rounded-xl bg-brand py-3 text-xs font-bold transition hover:bg-brand-bright disabled:opacity-40"
          >
            {busy ? '처리 중…' : '이대로 사용'}
          </button>
          <button
            type="button"
            onClick={() => setView({ zoom: 1, x: 0, y: 0 })}
            className="rounded-xl bg-white/8 px-4 py-3 text-xs font-bold transition hover:bg-white/14"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  )
}
