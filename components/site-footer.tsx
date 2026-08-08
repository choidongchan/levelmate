import Link from 'next/link'
import { COMPANY, companyLines } from '@/lib/legal'
import { SITE_NAME } from '@/lib/site'

/**
 * 화면 아래 사업자 표기.
 *
 * 전자상거래법이 상호·대표자·사업자등록번호·주소·연락처를 이용자가 쉽게 볼 수
 * 있는 곳에 적도록 하고 있다. 약관과 처리방침으로 가는 길도 여기서 열어둔다.
 */
export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line px-5 pt-5 pb-6 text-[11px] leading-relaxed text-dim">
      <div className="flex gap-4 font-bold">
        <Link href="/terms" className="text-muted transition hover:text-white">
          이용약관
        </Link>
        <Link href="/privacy" className="text-white transition hover:text-brand-bright">
          개인정보처리방침
        </Link>
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {companyLines().map(([label, value]) => (
          <div key={label} className="flex gap-1">
            <dt className="text-dim/70">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2">문의 가능 시간 {COMPANY.csHours}</p>

      <p className="mt-3 leading-relaxed">
        {SITE_NAME}은 통신판매중개자이며 회원 간 거래의 당사자가 아닙니다. 회원 간에 이루어진 게임
        지도·동행의 내용과 품질에 대한 책임은 해당 회원에게 있습니다.
      </p>

      <p className="mt-2">© {SITE_NAME}. All rights reserved.</p>
    </footer>
  )
}
