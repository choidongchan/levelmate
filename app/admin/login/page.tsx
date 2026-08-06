'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/icon'
import { adminLogin } from '@/lib/store'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    setError('')
    const ok = adminLogin(username, password)
    if (ok) router.replace('/admin')
    else setError('아이디 또는 비밀번호가 맞지 않습니다')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-2.5 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-lg font-black">
            관
          </span>
          <div>
            <p className="text-lg font-black tracking-tight">한판 관리자</p>
            <p className="mt-0.5 text-xs text-dim">운영자 전용 콘솔입니다</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex flex-col gap-2.5"
        >
          <label className="rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="block text-[11px] text-dim">아이디</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="mt-0.5 w-full bg-transparent text-sm outline-none"
            />
          </label>

          <label className="rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="block text-[11px] text-dim">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-0.5 w-full bg-transparent text-sm outline-none"
            />
          </label>

          {error && (
            <p className="flex items-center gap-1.5 px-1 text-xs text-[#f43f5e]">
              <Icon name="alert" className="size-3.5" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!username || !password}
            className="mt-1 rounded-2xl bg-brand py-3.5 text-sm font-bold transition hover:bg-brand-bright disabled:opacity-40"
          >
            로그인
          </button>
        </form>

        <p className="mt-5 flex gap-2 rounded-2xl border border-[#fbbf24]/25 bg-[#fbbf24]/8 px-4 py-3 text-[11px] leading-relaxed text-muted">
          <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-[#fbbf24]" />
          <span>
            지금은 계정 정보가 브라우저에 저장되는 임시 구조입니다. 실제 운영 전에
            서버 인증(비밀번호 해시 · 세션)으로 반드시 교체해야 합니다.
          </span>
        </p>
      </div>
    </main>
  )
}
