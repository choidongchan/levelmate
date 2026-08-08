import type { Metadata } from 'next'
import Link from 'next/link'
import { Items, LegalPage, Section, Table } from '@/components/legal-doc'
import { COMPANY, contact, EFFECTIVE_DATE, fill, PRIVACY_OFFICER } from '@/lib/legal'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME} 개인정보처리방침`,
}

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침" effective={EFFECTIVE_DATE}>
      <p className="text-xs leading-relaxed text-muted">
        {COMPANY.name}(이하 &ldquo;회사&rdquo;)는 {SITE_NAME} 서비스를 운영하면서 이용자의
        개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 지킵니다. 회사가 어떤 정보를
        어떤 목적으로 받아 얼마나 보관하는지 아래에 밝힙니다.
      </p>

      <Section title="1. 수집하는 개인정보와 이용 목적">
        <Table
          head={['구분', '항목', '이용 목적', '보유 기간']}
          rows={[
            [
              '회원가입 (필수)',
              '휴대전화번호, 닉네임',
              '본인 확인, 회원 식별, 예약 상대와의 연락',
              '탈퇴 시까지',
            ],
            [
              '프로필 (선택)',
              '프로필 사진, 활동 지역, 한 줄 소개',
              '다른 회원에게 나를 소개',
              '탈퇴 시까지',
            ],
            [
              '게임 계정 연결 (선택)',
              '게임 닉네임, 게임사 고유 식별자, 등급·승률·전적',
              '실제 실력 표시, 계정 도용 방지',
              '연결 해제 또는 탈퇴 시까지',
            ],
            [
              '예약·결제',
              '예약 일시, 이용 시간, 결제 금액, 결제 수단 정보',
              '예약 이행, 정산, 환불',
              '전자상거래법에 따라 5년',
            ],
            [
              '이용 중 생성',
              '대화 내용, 후기, 약속 이행 기록, 신고 내역',
              '분쟁 조정, 이용 제한 판단, 서비스 개선',
              '탈퇴 후 3개월 (분쟁 대비)',
            ],
            [
              '자동 수집',
              '접속 일시, 접속 기기·브라우저 정보, IP 주소',
              '부정 이용 방지, 오류 파악',
              '3개월',
            ],
          ]}
        />
        <p>
          회사는 사상·신념, 정치적 견해, 건강, 성생활 등에 관한 정보와 주민등록번호를 수집하지
          않습니다. 게임 계정의 비밀번호도 받지 않습니다.
        </p>
      </Section>

      <Section title="2. 개인정보의 보유 및 파기">
        <Items
          items={[
            '회사는 위 표에 적힌 기간이 지나거나 이용 목적이 끝나면 지체 없이 개인정보를 파기합니다.',
            '다만 법령이 따로 보존 기간을 정한 경우에는 그 기간 동안 보관합니다. 계약·청약철회 기록 5년, 대금 결제 및 재화 공급 기록 5년, 소비자 불만·분쟁 처리 기록 3년(전자상거래법), 표시·광고 기록 6개월입니다.',
            '전자적 파일은 복구할 수 없는 방법으로 삭제하고, 종이 문서는 분쇄하거나 소각합니다.',
            '1년 이상 서비스를 이용하지 않은 회원의 개인정보는 따로 분리하여 보관하며, 분리 30일 전에 알려드립니다.',
          ]}
        />
      </Section>

      <Section title="3. 개인정보의 제3자 제공">
        <p>
          회사는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우에는 예외로 합니다.
        </p>
        <Items
          items={[
            '이용자가 미리 동의한 경우',
            '법령에 정해진 절차와 방법에 따라 수사기관이 요구하는 경우',
            <>
              예약이 확정되면 <b className="text-white">상대 회원에게</b> 닉네임, 프로필 사진, 약속
              이행 기록, 예약한 시간과 장소가 전달됩니다. 예약을 이행하는 데 꼭 필요한 범위입니다.
              휴대전화번호는 본인과 회사만 볼 수 있으며 다른 회원에게는 가운데 자리를 가려 보여줍니다.
            </>,
          ]}
        />
      </Section>

      <Section title="4. 개인정보 처리의 위탁">
        <Table
          head={['위탁받는 곳', '위탁하는 일']}
          rows={[
            ['결제 대행사', '결제 처리 및 환불'],
            ['본인확인 기관', '휴대전화 본인 확인'],
            ['클라우드 서버 제공사', '서비스 운영을 위한 서버 및 데이터 보관'],
          ]}
        />
        <p>
          회사는 위탁계약을 맺을 때 개인정보를 안전하게 다루도록 정하고 있으며, 위탁받는 곳이
          바뀌면 이 방침을 고쳐 알립니다.
        </p>
      </Section>

      <Section title="5. 게임사 공개 API 이용">
        <Items
          items={[
            '이용자가 게임 계정을 연결하면, 회사는 각 게임사가 공개한 API 를 통해 해당 계정의 등급·전적 정보를 받아옵니다.',
            '이때 회사가 게임사에 보내는 것은 이용자가 직접 입력한 게임 닉네임뿐이며, 회원의 휴대전화번호 등 다른 개인정보는 보내지 않습니다.',
            '연결을 해제하면 회사가 보관하던 해당 게임 정보는 즉시 삭제됩니다.',
          ]}
        />
      </Section>

      <Section title="6. 이용자의 권리와 행사 방법">
        <Items
          items={[
            '이용자는 언제든지 자신의 개인정보를 보고, 고치고, 삭제하고, 처리를 멈추도록 요구할 수 있습니다.',
            '닉네임·소개·지역·사진은 서비스의 「마이」 화면에서 직접 고치거나 지울 수 있습니다.',
            '그 밖의 요구는 아래 개인정보 보호책임자에게 알려주시면 지체 없이 처리합니다.',
            '만 14세 미만 아동의 개인정보는 수집하지 않습니다.',
          ]}
        />
      </Section>

      <Section title="7. 개인정보의 안전성 확보 조치">
        <Items
          items={[
            '비밀번호는 되돌릴 수 없는 방식으로 변환하여 보관하며, 회사도 원래 값을 알 수 없습니다.',
            '개인정보를 다루는 사람을 최소한으로 두고, 접근 권한을 나누어 관리합니다.',
            '서비스와 브라우저 사이의 모든 통신은 암호화(HTTPS)합니다.',
            '접속 기록을 남겨 부정한 접근이 있었는지 확인합니다.',
            '개인정보가 담긴 데이터는 정기적으로 백업하며, 백업본도 같은 수준으로 관리합니다.',
          ]}
        />
      </Section>

      <Section title="8. 쿠키의 사용">
        <Items
          items={[
            '회사는 로그인 상태를 유지하기 위해 쿠키를 사용합니다. 이 쿠키는 브라우저 스크립트로 읽을 수 없게 설정되어 있습니다.',
            '이용자는 브라우저 설정에서 쿠키를 거부할 수 있으나, 그 경우 로그인이 필요한 기능을 쓸 수 없습니다.',
            '회사는 광고를 위한 추적 쿠키를 사용하지 않습니다.',
          ]}
        />
      </Section>

      <Section title="9. 개인정보 보호책임자">
        <p>
          개인정보 처리에 관한 문의, 불만, 피해 구제는 아래로 연락해 주시기 바랍니다. 지체 없이
          답변드리겠습니다.
        </p>
        <div className="rounded-2xl bg-white/5 px-4 py-3.5 leading-relaxed">
          <p className="font-bold text-white">개인정보 보호책임자</p>
          <p className="mt-1">
            성명 {fill(PRIVACY_OFFICER.name)}
            <br />
            직책 {PRIVACY_OFFICER.title}
            <br />
            연락처 {fill(PRIVACY_OFFICER.email || COMPANY.email)}
          </p>
        </div>
      </Section>

      <Section title="10. 권익 침해 구제 방법">
        <p>
          개인정보 침해로 도움이 필요하시면 아래 기관에 문의하실 수 있습니다. 회사와 별개의
          기관입니다.
        </p>
        <Items
          items={[
            '개인정보분쟁조정위원회 — 1833-6972 (www.kopico.go.kr)',
            '개인정보침해신고센터 — 118 (privacy.kisa.or.kr)',
            '대검찰청 사이버수사과 — 1301 (www.spo.go.kr)',
            '경찰청 사이버수사국 — 182 (ecrm.police.go.kr)',
          ]}
        />
      </Section>

      <Section title="11. 처리방침의 변경">
        <p>
          이 방침을 고칠 때에는 적용일과 바뀐 내용을 서비스 화면에 미리 알립니다. 이용자에게
          불리하게 바뀌는 경우에는 30일 전부터 알립니다.
        </p>
        <p>이 방침은 {EFFECTIVE_DATE}부터 시행합니다.</p>
      </Section>

      <section className="flex flex-col gap-1.5 rounded-2xl bg-white/5 px-4 py-3.5 text-[11px] leading-relaxed text-dim">
        <p className="font-bold text-white">사업자 정보</p>
        <p>
          {COMPANY.name} · 대표자 {fill(COMPANY.ceo)}
          <br />
          사업자등록번호 {fill(COMPANY.bizNo)} · 통신판매업신고 {fill(COMPANY.mailOrderNo)}
          <br />
          {fill(COMPANY.address)}
          <br />
          문의 {contact()}
        </p>
        <Link href="/terms" className="mt-1 font-bold text-brand-bright">
          이용약관 보기 →
        </Link>
      </section>
    </LegalPage>
  )
}
