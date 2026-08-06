/**
 * 서비스 기준 주소.
 * 미리보기 배포처럼 도메인이 다른 환경에서는 NEXT_PUBLIC_SITE_URL로 덮어쓴다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.levelmate.co.kr'

export const SITE_NAME = '레벨메이트'

export const SITE_DESCRIPTION =
  '게임 친구가 필요할 때, 레벨메이트. 제휴 PC방에서 안전하게 만나는 게임 동행 매칭 플랫폼.'
