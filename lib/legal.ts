/**
 * 사업자 정보.
 *
 * 이용약관·개인정보처리방침·화면 아래 표기가 전부 여기 한 곳을 본다.
 * 등록이 끝나 번호와 주소가 나오면 이 파일만 고치면 전부 따라 바뀐다.
 *
 * 아직 안 나온 값은 빈 문자열로 둔다. 화면에는 "(사업자 등록 후 기재)" 로
 * 보인다. 지어낸 번호가 법적 고지에 실리는 것보다 비어 있는 편이 낫다.
 */

export const COMPANY = {
  /** 상호 */
  name: '주식회사 오버클론',
  /** 대표자 성명 */
  ceo: '최동찬',
  /** 사업자등록번호 */
  bizNo: '358-81-03695',
  /** 통신판매업 신고번호 */
  mailOrderNo: '제 2025-서울광진-0364호',
  /** 사업장 주소 */
  address: '04918 서울특별시 광진구 긴고랑로14길 11-10 (중곡동) 지층',
  /** 고객 문의 이메일 */
  email: 'eastchan@naver.com',
  /** 고객 문의 전화 */
  tel: '0502-1911-3355',
  /** 사업자 대표 전화 */
  repTel: '010-5737-6949',
  /** 문의를 받는 시간 */
  csHours: '평일 10:00~17:00 (점심 12:00~13:00) · 주말·공휴일 휴무',
} as const

/**
 * 개인정보 보호책임자.
 * 법이 회사가 아니라 사람의 이름과 연락처를 밝히도록 하고 있다.
 */
export const PRIVACY_OFFICER = {
  name: '최동찬',
  title: '대표',
  email: 'eastchan@naver.com',
} as const

/** 약관·처리방침 시행일. 고칠 때마다 함께 올린다. */
export const EFFECTIVE_DATE = '2026년 8월 9일'

const BLANK = '(사업자 등록 후 기재)'

/** 아직 안 나온 값을 화면에 어떻게 쓸지 한 군데서 정한다 */
export function fill(value: string) {
  return value.trim() || BLANK
}

/** 화면 아래에 한 줄로 쓰는 사업자 표기 */
export function companyLines() {
  return [
    ['상호', COMPANY.name],
    ['대표자', fill(COMPANY.ceo)],
    ['사업자등록번호', fill(COMPANY.bizNo)],
    ['통신판매업신고', fill(COMPANY.mailOrderNo)],
    ['주소', fill(COMPANY.address)],
    ['대표전화', fill(COMPANY.repTel)],
    ['문의', contact()],
  ] as const
}

/** 고객이 연락할 곳. 대표 개인 번호가 아니라 상담 창구를 먼저 보여준다. */
export function contact() {
  return [COMPANY.tel, COMPANY.email].filter(Boolean).join(' · ') || BLANK
}
