/**
 * 서비스 기준 주소.
 * 미리보기 배포처럼 도메인이 다른 환경에서는 NEXT_PUBLIC_SITE_URL로 덮어쓴다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.levelmate.co.kr'

export const SITE_NAME = '레벨메이트'

export const SITE_DESCRIPTION =
  '게임 알려주고, 배우고, 같이하고. 온라인으로도 PC방에서 만나서도 — 약속 잘 지키는 게임 메이트를 찾아보세요.'
