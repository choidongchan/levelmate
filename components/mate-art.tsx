/**
 * 프로필 사진 자리에 들어가는 생성형 배경.
 * 메이트마다 고정된 hue로 메시 그라데이션을 만들어, 사진이 붙기 전에도
 * '이미지가 안 뜬 자리'가 아니라 의도된 아트워크로 보이게 한다.
 */
export function mateMesh(hue: number): string {
  const h = (n: number) => (hue + n) % 360
  return [
    `radial-gradient(62% 62% at 24% 14%, hsl(${h(0)} 92% 66% / 0.95), transparent 64%)`,
    `radial-gradient(56% 56% at 86% 24%, hsl(${h(45)} 95% 62% / 0.9), transparent 66%)`,
    `radial-gradient(70% 70% at 58% 92%, hsl(${h(310)} 88% 52% / 0.8), transparent 68%)`,
    `linear-gradient(165deg, hsl(${h(20)} 60% 26%), hsl(${h(0)} 55% 12%))`,
  ].join(', ')
}

export function MateArt({ hue, className = '' }: { hue: number; className?: string }) {
  return <div className={className} style={{ backgroundImage: mateMesh(hue) }} aria-hidden />
}
