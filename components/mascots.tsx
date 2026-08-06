/**
 * 홈 키비주얼용 마스코트.
 * 헤드셋 쓴 두 캐릭터가 "같이 한판?" 하고 말을 거는 구성.
 */

export function MascotPair({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 150" className={className} aria-hidden>
      <defs>
        <linearGradient id="mp-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="mp-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* 왼쪽 — 보라 후디 */}
      <g transform="translate(18 22)">
        <path d="M12 96c0-26 14-40 32-40s32 14 32 40Z" fill="url(#mp-purple)" />
        <ellipse cx="44" cy="42" rx="34" ry="33" fill="#fff" />
        {/* 모자 */}
        <path d="M12 34a32 30 0 0 1 64 0Z" fill="url(#mp-purple)" />
        <path d="M8 34h40v6H8a3 3 0 0 1 0-6Z" fill="#8b5cf6" />
        <path d="M40 10h10v12H40Z" fill="#f9a8d4" />
        {/* 헤드셋 */}
        <path d="M8 44a36 36 0 0 1 72 0" stroke="#3b2a5c" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="-2" y="38" width="16" height="24" rx="8" fill="#3b2a5c" />
        <rect x="74" y="38" width="16" height="24" rx="8" fill="#3b2a5c" />
        <rect x="2" y="43" width="8" height="14" rx="4" fill="#c4b5fd" />
        {/* 표정 */}
        <circle cx="33" cy="44" r="4" fill="#2a2233" />
        <path d="M51 44c2-3 6-3 8 0" stroke="#2a2233" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="24" cy="53" rx="5" ry="3" fill="#ff9aa8" opacity="0.55" />
        <ellipse cx="64" cy="53" rx="5" ry="3" fill="#ff9aa8" opacity="0.55" />
        <path d="M38 54a7 7 0 0 0 12 0Z" fill="#e05a72" />
        {/* 브이 */}
        <path d="M78 66c6-4 12-2 14 3s-3 10-9 9-9-8-5-12Z" fill="#fff" />
      </g>

      {/* 픽셀 하트 */}
      <g transform="translate(118 52)">
        <path
          d="M4 0h8v4h4V0h8v4h4v8h-4v4h-4v4h-4v4h-8v-4H8v-4H4v-4H0V4h4Z"
          fill="#f43f5e"
        />
        <rect x="4" y="4" width="4" height="4" fill="#fda4af" />
      </g>

      {/* 오른쪽 — 핑크 후디 */}
      <g transform="translate(150 26)">
        <path d="M12 92c0-25 14-38 32-38s32 13 32 38Z" fill="url(#mp-pink)" />
        <ellipse cx="44" cy="40" rx="33" ry="32" fill="#fff" />
        {/* 리본 */}
        <path d="M56 8c6-4 12 0 11 6-1 5-7 6-11 3Z" fill="#f472b6" />
        <path d="M56 17c-6 4-12 0-11-6 1-5 7-6 11-3Z" fill="#f9a8d4" />
        <circle cx="56" cy="12" r="3.5" fill="#ec4899" />
        {/* 헤드셋 */}
        <path d="M9 42a35 35 0 0 1 70 0" stroke="#f9a8d4" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="-1" y="36" width="16" height="24" rx="8" fill="#f9a8d4" />
        <rect x="73" y="36" width="16" height="24" rx="8" fill="#f9a8d4" />
        <rect x="2" y="41" width="8" height="14" rx="4" fill="#fff" />
        {/* 표정 */}
        <path d="M26 42c2-3 6-3 8 0" stroke="#2a2233" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="58" cy="42" r="4" fill="#2a2233" />
        <ellipse cx="22" cy="51" rx="5" ry="3" fill="#ff9aa8" opacity="0.55" />
        <ellipse cx="66" cy="51" rx="5" ry="3" fill="#ff9aa8" opacity="0.55" />
        <path d="M38 52a7 7 0 0 0 12 0Z" fill="#e05a72" />
      </g>
    </svg>
  )
}
