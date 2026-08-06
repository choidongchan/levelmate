/**
 * 프로필 사진 자리에 들어가는 생성형 배경.
 * 메이트마다 고정된 hue로 메시 그라데이션을 만들어, 사진이 붙기 전에도
 * '이미지가 안 뜬 자리'가 아니라 의도된 아트워크로 보이게 한다.
 */
export function mateMesh(hue: number): string {
  const h = (n: number) => (hue + n) % 360
  return [
    `radial-gradient(60% 60% at 22% 16%, hsl(${h(0)} 88% 62% / 0.9), transparent 62%)`,
    `radial-gradient(52% 52% at 84% 22%, hsl(${h(45)} 92% 58% / 0.8), transparent 64%)`,
    `radial-gradient(74% 72% at 62% 98%, hsl(${h(300)} 82% 46% / 0.75), transparent 66%)`,
    `linear-gradient(165deg, hsl(${h(20)} 45% 16%), hsl(${h(0)} 50% 7%))`,
  ].join(', ')
}

export function MateArt({ hue, className = '' }: { hue: number; className?: string }) {
  return <div className={className} style={{ backgroundImage: mateMesh(hue) }} aria-hidden />
}
