export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#lm-logo)" />
      {/* 말풍선 — "같이 한판?" 하고 말을 거는 모양 */}
      <path
        d="M11 13h26a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H23l-7 6v-6h-5a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3Z"
        fill="#fff"
      />
      <text
        x="24"
        y="29.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="900"
        fill="#7c3aed"
        fontFamily="-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
      >
        한
      </text>
    </svg>
  )
}
