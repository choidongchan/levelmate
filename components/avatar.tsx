/**
 * 실제 프로필 사진이 붙기 전까지 쓰는 자리표시 아바타.
 * 닉네임 첫 글자 + 메이트별 고정 hue로 색을 만들어 매번 같은 색이 나오게 한다.
 */
export function Avatar({
  nickname,
  hue,
  className = '',
  rounded = 'rounded-2xl',
}: {
  nickname: string
  hue: number
  className?: string
  rounded?: string
}) {
  const initial = [...nickname][0] ?? '?'

  return (
    <div
      className={`${rounded} ${className} flex items-center justify-center overflow-hidden font-semibold text-white/90 select-none`}
      style={{
        background: `linear-gradient(150deg,
          hsl(${hue} 55% 32%) 0%,
          hsl(${(hue + 28) % 360} 48% 20%) 55%,
          hsl(${(hue + 50) % 360} 40% 14%) 100%)`,
      }}
    >
      <span className="drop-shadow">{initial}</span>
    </div>
  )
}
