'use client'

import { useState } from 'react'
import { championIcon } from '@/lib/riot'

/**
 * 등급·자리 그림.
 *
 * 글자만 늘어놓으면 훑어지지가 않는다. 그렇다고 라이엇 CDN 에서 엠블럼을
 * 끌어오면 그쪽이 주소를 바꾸는 순간 화면이 텅 빈다. 그래서 등급 문장과
 * 자리 아이콘은 여기서 직접 그린다. 색만 등급에 맞춰 바꾼다.
 *
 * 챔피언 얼굴만은 그릴 수가 없어 라이엇 Data Dragon 을 쓴다.
 * 못 받아오면 이름 글자로 되돌아간다.
 */

// ─────────────────────────── 등급 문장 ───────────────────────────

/**
 * 등급 문장. 방패 모양에 등급 색을 입히고 안쪽 표시로 높낮이를 나눈다.
 * 높은 등급일수록 안쪽 표시가 많아진다.
 */
export function TierCrest({
  color,
  rank = 1,
  className = 'size-5',
}: {
  color: string
  /** 1~5. 높을수록 화려해진다 */
  rank?: number
  className?: string
}) {
  const id = `crest-${color.replace('#', '')}-${rank}`
  return (
    <svg viewBox="0 0 24 26" className={`${className} shrink-0`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {/* 방패 */}
      <path
        d="M12 1 22 4.6v9.1c0 5.2-4 9.4-10 11.6C6 23.1 2 18.9 2 13.7V4.6L12 1Z"
        fill={`url(#${id})`}
        stroke={color}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* 안쪽 표시 — 등급이 높을수록 겹겹이 쌓인다 */}
      {Array.from({ length: Math.min(Math.max(rank, 1), 4) }).map((_, i) => (
        <path
          key={i}
          d={`M6.5 ${16 - i * 3.4} 12 ${11.4 - i * 3.4} 17.5 ${16 - i * 3.4}`}
          fill="none"
          stroke="#0b0b12"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

/** 등급 이름에서 문장의 화려함(1~4)을 정한다 */
export function crestRank(tier: string | null): number {
  if (!tier) return 1
  const t = tier
  if (/챌린저|레디언트|이터니티|그랜드마스터|챔피언|슈퍼챌린지|프레데터/.test(t)) return 4
  if (/마스터|불멸|초월자|데미갓|미스릴|월드클래스|레전드/.test(t)) return 3
  if (/다이아|에메랄드|메테오라이트|챌린지/.test(t)) return 2
  return 1
}

// ─────────────────────────── 자리 아이콘 ───────────────────────────

const ROLE_PATHS: Record<string, string> = {
  // 탑 — 왼쪽 위 모서리
  TOP: 'M3 3h8v2.6H5.6V11H3V3Zm3.4 3.4h2.2v2.2H6.4V6.4ZM21 21h-8v-2.6h5.4V13H21v8Zm-3.4-3.4h-2.2v-2.2h2.2v2.2Z',
  // 정글 — 나뭇잎
  JUNGLE:
    'M12 2c4 3.4 6.6 7.2 6.6 11.2 0 4-2.8 6.8-6.6 8.8-3.8-2-6.6-4.8-6.6-8.8C5.4 9.2 8 5.4 12 2Zm0 4.2c-2 2.2-3.4 4.6-3.4 7 0 2.4 1.4 4.2 3.4 5.6V6.2Z',
  // 미드 — 대각선
  MID: 'M3 3h7v2.5H6.8L18 16.7V13.5h3V21h-7v-2.5h3.2L6 7.3V10.5H3V3Z',
  // 원딜 — 조준점
  ADC: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.6a7.4 7.4 0 1 1 0 14.8 7.4 7.4 0 0 1 0-14.8ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z',
  // 서포터 — 방패
  SUPPORT: 'M12 2 3.5 5.4v6.2c0 5 3.6 9.3 8.5 10.4 4.9-1.1 8.5-5.4 8.5-10.4V5.4L12 2Zm-1.3 5.8h2.6v3h3v2.6h-3v3h-2.6v-3h-3v-2.6h3v-3Z',
  // 탱커 — 두꺼운 방패
  TANK: 'M12 2 3.5 5.4v6.2c0 5 3.6 9.3 8.5 10.4 4.9-1.1 8.5-5.4 8.5-10.4V5.4L12 2Zm0 3 5.9 2.3v4.3c0 3.5-2.4 6.6-5.9 7.5-3.5-.9-5.9-4-5.9-7.5V7.3L12 5Z',
  // 딜러 — 겨냥한 화살
  DAMAGE: 'M21 3v6h-2.6V7.4l-4.6 4.6 4.6 4.6V15H21v6h-6v-2.6h1.6L12 13.8l-4.6 4.6H9V21H3v-6h2.6v1.6l4.6-4.6L5.6 7.4V9H3V3h6v2.6H7.4L12 10.2l4.6-4.6H15V3h6Z',
  // 힐러 — 십자
  HEALER: 'M9.4 2h5.2v7.4H22v5.2h-7.4V22H9.4v-7.4H2V9.4h7.4V2Z',
  // 타격대·척후대 등 발로란트
  DUELIST: 'M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
  INITIATOR: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.3 4.6v6.1l4.4 2.6-1.3 2.2-5.7-3.4V6.6h2.6Z',
  CONTROLLER: 'M4 4h16v3.4H4V4Zm0 6.3h16v3.4H4v-3.4ZM4 16.6h16V20H4v-3.4Z',
  SENTINEL: 'M12 2 3.5 5.4v6.2c0 5 3.6 9.3 8.5 10.4 4.9-1.1 8.5-5.4 8.5-10.4V5.4L12 2Zm0 4.4a3.6 3.6 0 0 1 3.6 3.6v1.2h1v6H7.4v-6h1V10A3.6 3.6 0 0 1 12 6.4Zm0 2.2a1.4 1.4 0 0 0-1.4 1.4v1.2h2.8V10A1.4 1.4 0 0 0 12 8.6Z',
}

export function RoleIcon({
  role,
  className = 'size-3.5',
  color,
}: {
  role: string
  className?: string
  color?: string
}) {
  const d = ROLE_PATHS[role]
  if (!d) return null
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill={color ?? 'currentColor'} aria-hidden>
      <path d={d} />
    </svg>
  )
}

export function hasRoleIcon(role: string | null | undefined) {
  return Boolean(role && ROLE_PATHS[role])
}

// ─────────────────────────── 챔피언 얼굴 ───────────────────────────

/**
 * 라이엇 Data Dragon 의 챔피언 그림.
 * 주소가 바뀌거나 새 챔피언이라 그림이 없으면 이름 글자로 되돌아간다.
 */
export function ChampionIcon({
  name,
  size = 22,
  className = '',
}: {
  name: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = championIcon(name)

  if (failed || !src) {
    return (
      <span className={`rounded bg-white/8 px-1 py-0.5 text-[10px] text-muted ${className}`}>
        {name}
      </span>
    )
  }

  return (
    // 라이엇 CDN 은 우리 서버를 거치지 않는다. next/image 로 감싸면
    // 그림 하나 때문에 서버가 밖으로 나가야 해서 그냥 브라우저가 받게 둔다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      title={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-md bg-white/6 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
