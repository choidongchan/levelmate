'use client'

import { useEffect, useState } from 'react'
import { PageTitle, Panel } from '@/components/admin-ui'
import { Icon } from '@/components/icon'

type Status = {
  riot: { set: boolean; source: 'env' | 'db' | null; masked: string | null }
  test?: { ok: boolean; message: string }
}

/**
 * 운영 설정.
 *
 * 서버에 들어가 파일을 고치지 않고도 바꿀 수 있게 여기에 둔다.
 * 키 원문은 화면으로 내려오지 않는다. 넣을 수만 있고 꺼내 볼 수는 없다.
 */
export default function AdminSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState<'save' | 'test' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setStatus(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const send = async (op: string, value?: string) => {
    setError('')
    setBusy(op === 'saveRiotKey' ? 'save' : 'test')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, value }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? '처리하지 못했습니다')
      else {
        setStatus(data)
        setKey('')
      }
    } catch {
      setError('서버에 연결하지 못했습니다')
    } finally {
      setBusy(null)
    }
  }

  const riot = status?.riot
  const fromEnv = riot?.source === 'env'

  return (
    <>
      <PageTitle title="설정" desc="서버에 들어가지 않고 여기서 바꿉니다" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="라이엇 게임즈 API 키">
          <div className="flex flex-col gap-3 py-1">
            <div className="flex items-center gap-2">
              {riot?.set ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-online/15 px-2.5 py-1 text-[11px] font-bold text-online">
                    <Icon name="check" className="size-3" />
                    설정됨
                  </span>
                  <code className="text-xs text-dim">{riot.masked}</code>
                  {fromEnv && <span className="text-[11px] text-dim">(서버 .env 값 사용 중)</span>}
                </>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fbbf24]/15 px-2.5 py-1 text-[11px] font-bold text-[#fbbf24]">
                  <Icon name="alert" className="size-3" />
                  아직 없음
                </span>
              )}
            </div>

            <p className="text-[11px] leading-relaxed text-muted">
              회원이 라이엇 계정을 연결해 <b className="text-white">실제 티어·승률·챔피언</b>을
              보여주는 데 씁니다. 키가 없으면 그 기능만 쉬고 나머지는 그대로 돕니다.
              <br />
              developer.riotgames.com 에서 받습니다. 개발용 키는{' '}
              <b className="text-white">24시간마다 만료</b>되니, 끊기면 여기서 새 키로 바꾸면
              됩니다.
            </p>

            {fromEnv ? (
              <p className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-dim">
                지금은 서버 파일(.env)에 넣은 값을 쓰고 있습니다. 화면에서 바꾸려면 서버의
                RIOT_API_KEY 줄을 지워야 합니다.
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="RGAPI-…"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 rounded-xl bg-white/6 px-3.5 py-2.5 font-mono text-xs outline-none placeholder:text-dim"
                />
                <button
                  type="button"
                  disabled={!key.trim() || busy !== null}
                  onClick={() => send('saveRiotKey', key)}
                  className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold transition hover:bg-brand-bright disabled:opacity-40"
                >
                  {busy === 'save' ? '저장 중…' : '저장'}
                </button>
              </div>
            )}

            {error && <p className="text-[11px] text-[#f43f5e]">{error}</p>}

            {status?.test && (
              <p
                className={`flex gap-2 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
                  status.test.ok ? 'bg-online/10 text-online' : 'bg-[#f43f5e]/10 text-[#f43f5e]'
                }`}
              >
                <Icon name={status.test.ok ? 'check' : 'alert'} className="mt-0.5 size-3.5 shrink-0" />
                <span>{status.test.message}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!riot?.set || busy !== null}
                onClick={() => send('testRiotKey')}
                className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3.5 py-2 text-[11px] font-bold transition hover:bg-white/14 disabled:opacity-40"
              >
                <Icon name="refresh" className="size-3.5" />
                {busy === 'test' ? '확인 중…' : '연결 확인'}
              </button>
              {riot?.set && !fromEnv && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    if (confirm('키를 지울까요? 라이엇 연동이 멈춥니다.')) {
                      void send('saveRiotKey', '')
                    }
                  }}
                  className="rounded-xl bg-white/8 px-3.5 py-2 text-[11px] font-bold text-dim transition hover:bg-white/14"
                >
                  키 지우기
                </button>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="알아두기">
          <ul className="flex list-disc flex-col gap-2 py-1 pl-4 text-[11px] leading-relaxed text-muted">
            <li>
              키는 서버 DB 에만 담기고 <b className="text-white">화면으로 내려오지 않습니다.</b>{' '}
              여기서도 끝 네 글자만 보입니다.
            </li>
            <li>
              DB 백업(매일)에 함께 들어갑니다. 백업 파일을 남에게 주지 마세요.
            </li>
            <li>
              실서비스에는 만료되지 않는 <b className="text-white">Personal API Key</b> 가
              필요합니다. developer.riotgames.com → REGISTER PRODUCT 에서 신청합니다.
            </li>
            <li>
              키가 만료되면 회원 화면에 &ldquo;라이엇 키가 만료되었거나 잘못되었습니다&rdquo; 가
              뜹니다. 그때 여기서 새 키로 바꾸면 바로 정상으로 돌아옵니다.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  )
}
