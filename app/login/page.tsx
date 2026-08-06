'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Icon } from '@/components/icon'
import { Logo } from '@/components/logo'
import { ScreenHeader } from '@/components/screen-header'
import { login } from '@/lib/store'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  )
}

function LoginScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const digits = phone.replace(/[^0-9]/g, '')
  const phoneValid = digits.length >= 10 && digits.startsWith('01')

  return (
    <>
      <ScreenHeader title="로그인" />

      <main className="flex flex-col gap-6 px-5 pt-6">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Logo className="size-14" />
          <div>
            <p className="text-lg font-black tracking-tight">레벨메이트 시작하기</p>
            <p className="mt-1 text-xs text-dim">
              휴대폰 본인 인증을 마친 사람만 글을 올리고 예약할 수 있어요
            </p>
          </div>
        </div>

        {step === 'phone' ? (
          <div className="flex flex-col gap-3">
            <Field label="휴대폰 번호">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full bg-transparent text-base outline-none placeholder:text-dim"
              />
            </Field>

            <button
              type="button"
              disabled={!phoneValid}
              onClick={() => {
                setError('')
                setStep('code')
              }}
              className="brand-gradient rounded-2xl py-4 text-sm font-bold transition active:scale-[0.99] disabled:opacity-40"
            >
              인증번호 받기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="인증번호">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6자리"
                className="w-full bg-transparent text-base tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-dim"
              />
            </Field>

            <Field label="닉네임 (처음이신 경우)">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="게임에서 쓰는 이름"
                maxLength={12}
                className="w-full bg-transparent text-base outline-none placeholder:text-dim"
              />
            </Field>

            {error && <p className="text-xs text-[#f43f5e]">{error}</p>}

            <button
              type="button"
              disabled={code.length !== 6}
              onClick={() => {
                try {
                  login(phone, nickname)
                  router.replace(next)
                } catch {
                  setError('로그인에 실패했어요. 다시 시도해주세요.')
                }
              }}
              className="brand-gradient rounded-2xl py-4 text-sm font-bold transition active:scale-[0.99] disabled:opacity-40"
            >
              인증하고 시작하기
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="py-2 text-xs text-dim transition hover:text-muted"
            >
              번호 다시 입력
            </button>
          </div>
        )}

        <p className="flex gap-2 rounded-2xl border border-[#fbbf24]/25 bg-[#fbbf24]/8 px-4 py-3 text-[11px] leading-relaxed text-muted">
          <Icon name="info" className="mt-0.5 size-4 shrink-0 text-[#fbbf24]" />
          <span>
            지금은 인증 절차를 흉내낸 상태라 <b className="text-white">아무 6자리</b>나 넣으면
            들어갑니다. PASS·NICE 같은 본인확인 서비스를 붙이면 이 화면 그대로 실제 인증으로
            바뀝니다.
          </span>
        </p>
      </main>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="glass block rounded-2xl px-4 py-3">
      <span className="block text-[11px] text-dim">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
