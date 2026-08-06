export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#lm-logo)" />
      {/* 레벨업 화살표를 겹친 M */}
      <path
        d="M12 34V17.5l8 8.5 8-8.5V34"
        fill="none"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 27.5 36 22l5 5.5"
        fill="none"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}
