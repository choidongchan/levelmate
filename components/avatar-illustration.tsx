/**
 * 코드로 그리는 캐릭터 아바타.
 * 사용자마다 고정된 값(hue)에서 머리·눈·표정·소품을 정해, 같은 사람은 항상 같은 얼굴이 나온다.
 * 실제 사진이 등록되면 이 자리를 사진이 대신한다.
 */

const SKIN = ['#ffd9c0', '#f7c9a8', '#e8b48f', '#ffe0cc']

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length]
}

export function AvatarIllustration({
  hue,
  className = '',
}: {
  hue: number
  className?: string
}) {
  // hue 하나에서 모든 특징을 뽑아낸다
  const hair = hue % 5
  const eyes = Math.floor(hue / 5) % 3
  const mouth = Math.floor(hue / 15) % 3
  const gear = Math.floor(hue / 45) % 4
  const skin = pick(SKIN, Math.floor(hue / 7))

  const hairColor = `hsl(${(hue + 200) % 360} 35% ${22 + (hue % 3) * 6}%)`
  const hairLight = `hsl(${(hue + 200) % 360} 40% ${34 + (hue % 3) * 6}%)`
  const clothes = `hsl(${hue} 65% 55%)`
  const bgFrom = `hsl(${hue} 70% 62%)`
  const bgTo = `hsl(${(hue + 40) % 360} 65% 42%)`

  const gid = `av${hue}`

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${gid}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgFrom} />
          <stop offset="100%" stopColor={bgTo} />
        </linearGradient>
        <clipPath id={`${gid}clip`}>
          <rect width="100" height="100" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${gid}clip)`}>
        <rect width="100" height="100" fill={`url(#${gid}bg)`} />

        {/* 몸통 */}
        <path d="M18 100c0-17 14-28 32-28s32 11 32 28Z" fill={clothes} />
        <path d="M42 74h16v8a8 8 0 0 1-16 0Z" fill={skin} />

        {/* 뒷머리 */}
        {hair !== 2 && (
          <ellipse cx="50" cy="46" rx="30" ry="32" fill={hairColor} />
        )}

        {/* 얼굴 */}
        <ellipse cx="50" cy="48" rx="25" ry="27" fill={skin} />
        {/* 귀 */}
        <ellipse cx="25" cy="50" rx="4" ry="6" fill={skin} />
        <ellipse cx="75" cy="50" rx="4" ry="6" fill={skin} />

        {/* 앞머리 — 유형별 */}
        {hair === 0 && (
          <path d="M24 44c0-16 12-25 26-25s26 9 26 25c-4-8-14-11-26-11S28 36 24 44Z" fill={hairColor} />
        )}
        {hair === 1 && (
          <>
            <path d="M24 45c0-17 12-26 26-26s26 9 26 26c-5-6-9-12-14-11-6 1-9 6-16 5-9-1-14-4-22 6Z" fill={hairColor} />
            <path d="M30 30c6-7 14-10 22-9-6 3-11 6-14 11Z" fill={hairLight} />
          </>
        )}
        {hair === 2 && (
          <>
            {/* 짧은 머리 */}
            <path d="M25 46c0-16 11-27 25-27s25 11 25 27c-3-11-12-16-25-16s-22 5-25 16Z" fill={hairColor} />
            <path d="M40 22c5-3 12-4 18-1-6 0-12 2-18 6Z" fill={hairLight} />
          </>
        )}
        {hair === 3 && (
          <>
            {/* 포니테일 */}
            <path d="M24 44c0-16 12-25 26-25s26 9 26 25c-4-8-14-11-26-11S28 36 24 44Z" fill={hairColor} />
            <ellipse cx="80" cy="52" rx="8" ry="16" fill={hairColor} />
            <circle cx="76" cy="38" r="4" fill={clothes} />
          </>
        )}
        {hair === 4 && (
          <>
            {/* 가운데 가르마 */}
            <path d="M24 46c0-17 12-27 26-27s26 10 26 27c-3-10-8-14-13-16-4 6-9 9-13 9s-9-3-13-9c-5 2-10 6-13 16Z" fill={hairColor} />
          </>
        )}

        {/* 눈 */}
        {eyes === 0 && (
          <>
            <ellipse cx="40" cy="50" rx="3.6" ry="4.6" fill="#2a2233" />
            <ellipse cx="60" cy="50" rx="3.6" ry="4.6" fill="#2a2233" />
            <circle cx="41.4" cy="48.4" r="1.3" fill="#fff" />
            <circle cx="61.4" cy="48.4" r="1.3" fill="#fff" />
          </>
        )}
        {eyes === 1 && (
          <>
            {/* 웃는 눈 */}
            <path d="M36 51c2-3 6-3 8 0" stroke="#2a2233" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M56 51c2-3 6-3 8 0" stroke="#2a2233" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyes === 2 && (
          <>
            <ellipse cx="40" cy="50" rx="3" ry="5" fill="#2a2233" />
            <ellipse cx="60" cy="50" rx="3" ry="5" fill="#2a2233" />
            <circle cx="41" cy="48" r="1.1" fill="#fff" />
            <circle cx="61" cy="48" r="1.1" fill="#fff" />
            {/* 안경 */}
            <g stroke="#3b3b52" strokeWidth="1.6" fill="none" opacity="0.85">
              <circle cx="40" cy="50" r="7.5" />
              <circle cx="60" cy="50" r="7.5" />
              <path d="M47.5 50h5" />
            </g>
          </>
        )}

        {/* 볼터치 */}
        <ellipse cx="32" cy="57" rx="4.5" ry="2.8" fill="#ff9aa8" opacity="0.5" />
        <ellipse cx="68" cy="57" rx="4.5" ry="2.8" fill="#ff9aa8" opacity="0.5" />

        {/* 입 */}
        {mouth === 0 && (
          <path d="M46 60c2 2.5 6 2.5 8 0" stroke="#8a4a52" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {mouth === 1 && <ellipse cx="50" cy="61" rx="3" ry="3.6" fill="#8a4a52" />}
        {mouth === 2 && (
          <path d="M45 60h10" stroke="#8a4a52" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* 소품 — 게이머답게 */}
        {gear === 1 && (
          <>
            {/* 헤드셋 */}
            <path d="M22 48a28 28 0 0 1 56 0" stroke="#2f2f45" strokeWidth="4" fill="none" strokeLinecap="round" />
            <rect x="16" y="44" width="10" height="16" rx="5" fill="#2f2f45" />
            <rect x="74" y="44" width="10" height="16" rx="5" fill="#2f2f45" />
            <rect x="18.5" y="47" width="5" height="10" rx="2.5" fill={clothes} />
          </>
        )}
        {gear === 2 && (
          <>
            {/* 캡모자 */}
            <path d="M22 38a28 26 0 0 1 56 0Z" fill={clothes} />
            <path d="M18 38h34v5H18a2.5 2.5 0 0 1 0-5Z" fill={clothes} opacity="0.85" />
          </>
        )}
        {gear === 3 && (
          <>
            {/* 후드 */}
            <path d="M18 74c0-14 10-22 14-24l4 6c-6 3-10 9-10 18Z" fill={clothes} opacity="0.9" />
            <path d="M82 74c0-14-10-22-14-24l-4 6c6 3 10 9 10 18Z" fill={clothes} opacity="0.9" />
          </>
        )}
      </g>
    </svg>
  )
}
