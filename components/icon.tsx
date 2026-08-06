import type { SVGProps } from 'react'

/**
 * 아이콘은 전부 인라인 SVG로 둔다. PC방 PC가 오프라인이거나
 * 외부 CDN이 막혀 있어도 아이콘이 깨지지 않게 하기 위함.
 */
const PATHS = {
  search: <path d="M11 3a8 8 0 1 0 4.9 14.32l4.39 4.39 1.42-1.42-4.39-4.39A8 8 0 0 0 11 3Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />,
  calendar: (
    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8v10H5V10h14ZM5 6h2v1h2V6h6v1h2V6h2v2H5V6Z" />
  ),
  qr: (
    <path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h3v3h-3v-3Zm5 0h3v3h-3v-3Zm-5 5h3v3h-3v-3Zm5 0h3v3h-3v-3Z" />
  ),
  gamepad: (
    <path d="M7 6h10a5 5 0 0 1 5 5v3a4 4 0 0 1-7.2 2.4L14.2 15H9.8l-.6.8A4 4 0 0 1 2 14v-3a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v3a2 2 0 0 0 3.6 1.2L8.8 13h6.4l1.2 1.6A2 2 0 0 0 20 14v-3a3 3 0 0 0-3-3H7Zm0 2h2v1h1v2H9v1H7v-1H6v-2h1v-1Zm9 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm2 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
  home: <path d="M12 3 2 11h3v10h6v-6h2v6h6V11h3L12 3Z" />,
  chat: <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v11h2v2.1L8.6 16H20V5H4Z" />,
  user: <path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 9c4.4 0 8 2.2 8 5v2H4v-2c0-2.8 3.6-5 8-5Zm0 2c-3.5 0-6 1.6-6 3h12c0-1.4-2.5-3-6-3Z" />,
  headset: (
    <path d="M12 2a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9Z" />
  ),
  chart: <path d="M3 20h18v2H3v-2Zm2-6h3v5H5v-5Zm5-5h3v10h-3V9Zm5-6h3v16h-3V3Z" />,
  monitor: <path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h4v2H6v-2h4v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9h16V6H4Z" />,
  group: (
    <path d="M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 .5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9 13c3.3 0 6 1.8 6 4v3H3v-3c0-2.2 2.7-4 6-4Zm0 2c-2.4 0-4 1.2-4 2v1h8v-1c0-.8-1.6-2-4-2Zm8-1c2.8 0 5 1.5 5 3.5V20h-5v-3c0-1.1-.5-2.1-1.4-2.9.4 0 .9-.1 1.4-.1Z" />
  ),
  trophy: (
    <path d="M6 3h12v2h3v3a4 4 0 0 1-3.4 4A6 6 0 0 1 13 15.9V18h4v2H7v-2h4v-2.1A6 6 0 0 1 6.4 12 4 4 0 0 1 3 8V5h3V3Zm2 2v5a4 4 0 0 0 8 0V5H8ZM5 7v1a2 2 0 0 0 1 1.7V7H5Zm13 0v2.7A2 2 0 0 0 19 8V7h-1Z" />
  ),
  id: <path d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v1h6V7a3 3 0 0 0-3-3ZM6 10v10h12V10H6Zm6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />,
  check: <path d="M20.3 5.7 9 17l-5.3-5.3 1.4-1.4L9 14.2l9.9-9.9 1.4 1.4Z" />,
  alert: <path d="M12 2 1 21h22L12 2Zm0 4 7.5 13h-15L12 6Zm-1 5v4h2v-4h-2Zm0 5v2h2v-2h-2Z" />,
  shield: <path d="M12 2 4 5v6.5c0 5 3.4 9.4 8 10.5 4.6-1.1 8-5.5 8-10.5V5l-8-3Zm0 2.2 6 2.2v5.1c0 3.9-2.5 7.4-6 8.4-3.5-1-6-4.5-6-8.4V6.4l6-2.2Z" />,
  chevronRight: <path d="M9.3 6.7 10.7 5.3 17.4 12l-6.7 6.7-1.4-1.4L14.6 12 9.3 6.7Z" />,
  chevronLeft: <path d="M14.7 6.7 13.3 5.3 6.6 12l6.7 6.7 1.4-1.4L9.4 12l5.3-5.3Z" />,
  chevronDown: <path d="M6.7 9.3 5.3 10.7 12 17.4l6.7-6.7-1.4-1.4L12 14.6 6.7 9.3Z" />,
  location: <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 2a5 5 0 0 0-5 5c0 2.8 3.1 7.5 5 9.9 1.9-2.4 5-7.1 5-9.9a5 5 0 0 0-5-5Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />,
  clock: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-1 3h2v5.4l3.5 2.1-1 1.7L11 13.6V7Z" />,
  info: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-1 3h2v2h-2V7Zm0 4h2v6h-2v-6Z" />,
  arrowRight: <path d="M13.2 5.3 11.8 6.7 16.1 11H4v2h12.1l-4.3 4.3 1.4 1.4L20 12l-6.8-6.7Z" />,
  download: <path d="M12 3v9.2l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4L10 12.2V3h2ZM4 19h16v2H4v-2Z" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  grid: <path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h8v8h-8v-8Zm2 2v4h4v-4h-4Z" />,
  list: <path d="M3 5h4v4H3V5Zm6 1h12v2H9V6ZM3 10h4v4H3v-4Zm6 1h12v2H9v-2ZM3 15h4v4H3v-4Zm6 1h12v2H9v-2Z" />,
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      {PATHS[name]}
    </svg>
  )
}
