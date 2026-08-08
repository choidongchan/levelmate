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
  ceo: '',
  /** 사업자등록번호 */
  bizNo: '',
  /** 통신판매업 신고번호 */
  mailOrderNo: '',
  /** 사업장 주소 */
  address: '',
  /** 고객 문의 이메일 */
  email: '',
  /** 고객 문의 전화 */
  tel: '',
} as const

/** 개인정보 보호책임자. 법이 이름과 연락처를 밝히도록 하고 있다. */
export const PRIVACY_OFFICER = {
  name: '',
  title: '대표',
  email: '',
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
    ['문의', [COMPANY.email, COMPANY.tel].filter(Boolean).join(' · ') || BLANK],
  ] as const
}
