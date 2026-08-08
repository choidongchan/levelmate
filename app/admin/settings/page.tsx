'use client'

import { useEffect, useState } from 'react'
import { PageTitle, Panel } from '@/components/admin-ui'
import { Icon } from '@/components/icon'

type KeyState = { set: boolean; source: 'env' | 'db' | null; masked: string | null }

type Status = {
  riot: KeyState
  pubg: KeyState
  fconline: KeyState
  maple: KeyState
  test?: { ok: boolean; message: string }
  lookup?: {
    kind: 'riot' | 'pubg' | 'nexon'
    ok: boolean
    message?: string
    name?: string
    tier?: string
    record?: string
    lp?: number
    mainRole?: string | null
    champions?: string
    kda?: string
    canVerify?: boolean
  }
}

type Send = (op: string, value?: string, platform?: string) => Promise<void>

/**
 * 운영 설정.
 *
 * 서버에 들어가 파일을 고치지 않고도 바꿀 수 있게 여기에 둔다.
 * 키 원문은 화면으로 내려오지 않는다. 넣을 수만 있고 꺼내 볼 수는 없다.
 *
 * 게임이 늘면 KeyPanel 을 하나 더 붙이면 된다.
 */
export default function AdminSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  // 결과(연결 확인·오류)가 어느 칸의 것인지 알아야 엉뚱한 칸에 뜨지 않는다.
  const [lastOp, setLastOp] = useState<string | null>(null)
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

  const send: Send = async (op, value, platform) => {
    setError('')
    setBusy(op)
    setLastOp(op)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, value, platform }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? '처리하지 못했습니다')
      else setStatus((prev) => ({ ...prev, ...data }))
    } catch {
      setError('서버에 연결하지 못했습니다')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageTitle title="설정" desc="서버에 들어가지 않고 여기서 바꿉니다" />

      <div className="grid gap-4 xl:grid-cols-2">
        <KeyPanel
          title="라이엇 게임즈 API 키"
          state={status?.riot}
          saveOp="saveRiotKey"
          testOp="testRiotKey"
          placeholder="RGAPI-…"
          envName="RIOT_API_KEY"
          busy={busy}
          lastOp={lastOp}
          send={send}
          test={status?.test}
          error={error}
        >
          회원이 라이엇 계정을 연결해 <b className="text-white">실제 티어·승률·챔피언</b>을 보여주는
          데 씁니다. 키가 없으면 그 기능만 쉬고 나머지는 그대로 돕니다.
          <br />
          developer.riotgames.com 에서 받습니다. 개발용 키는{' '}
          <b className="text-white">24시간마다 만료</b>되니, 끊기면 여기서 새 키로 바꾸면 됩니다.
        </KeyPanel>

        <KeyPanel
          title="배틀그라운드 API 키"
          state={status?.pubg}
          saveOp="savePubgKey"
          testOp="testPubgKey"
          placeholder="eyJ0eXAiOiJKV1Qi…"
          envName="PUBG_API_KEY"
          busy={busy}
          lastOp={lastOp}
          send={send}
          test={status?.test}
          error={error}
        >
          회원이 배그 계정을 연결해 <b className="text-white">랭크 티어·RP·평균 딜</b>을 보여주는 데
          씁니다. developer.pubg.com 에서 받고 <b className="text-white">만료되지 않습니다.</b>
          <br />
          다만 <b className="text-white">1분에 10번</b>만 부를 수 있어, 회원 한 명당 10분에 한 번만
          갱신하게 막아두었습니다.
        </KeyPanel>

        <KeyPanel
          title="FC 온라인 API 키"
          state={status?.fconline}
          saveOp="saveFconlineKey"
          testOp="testFconlineKey"
          placeholder="test_… 또는 live_…"
          envName="NEXON_FCONLINE_API_KEY"
          busy={busy}
          lastOp={lastOp}
          send={send}
          test={status?.test}
          error={error}
        >
          openapi.nexon.com 에 <b className="text-white">EA SPORTS FC 온라인</b>으로 등록한
          애플리케이션의 키입니다. 넥슨은 게임마다 애플리케이션이 따로라{' '}
          <b className="text-white">메이플 키와 다릅니다.</b>
          <br />
          라이엇과 달리 <b className="text-white">만료되지 않습니다.</b> 한 번 넣으면 계속 씁니다.
        </KeyPanel>

        <KeyPanel
          title="메이플스토리 API 키"
          state={status?.maple}
          saveOp="saveMapleKey"
          testOp="testMapleKey"
          placeholder="test_… 또는 live_…"
          envName="NEXON_MAPLE_API_KEY"
          busy={busy}
          lastOp={lastOp}
          send={send}
          test={status?.test}
          error={error}
        >
          openapi.nexon.com 에 <b className="text-white">메이플스토리</b>로 등록한 애플리케이션의
          키입니다. 위 FC 온라인 키와 서로 바꿔 넣으면 둘 다 안 됩니다.
          <br />
          메이플 전적은 <b className="text-white">하루에 한 번</b> 넥슨이 갱신합니다. 오늘 올린
          레벨은 내일 반영됩니다.
        </KeyPanel>

        <RiotLookup busy={busy} send={send} lookup={status?.lookup} />
        <PubgLookup busy={busy} send={send} lookup={status?.lookup} />
        <NexonLookup busy={busy} send={send} lookup={status?.lookup} />

        <Panel title="알아두기">
          <ul className="flex list-disc flex-col gap-2 py-1 pl-4 text-[11px] leading-relaxed text-muted">
            <li>
              키는 서버 DB 에만 담기고 <b className="text-white">화면으로 내려오지 않습니다.</b>{' '}
              여기서도 끝 네 글자만 보입니다.
            </li>
            <li>DB 백업(매일)에 함께 들어갑니다. 백업 파일을 남에게 주지 마세요.</li>
            <li>
              라이엇 실서비스에는 만료되지 않는 <b className="text-white">Personal API Key</b> 가
              필요합니다. developer.riotgames.com → REGISTER PRODUCT 에서 신청합니다.
            </li>
            <li>
              키가 만료되면 회원 화면에 &ldquo;키가 만료되었거나 잘못되었습니다&rdquo; 가 뜹니다.
              그때 여기서 새 키로 바꾸면 바로 정상으로 돌아옵니다.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  )
}

/** 게임 API 키 한 칸. 게임마다 같은 모양이라 하나로 묶는다. */
function KeyPanel({
  title,
  state,
  saveOp,
  testOp,
  placeholder,
  envName,
  busy,
  lastOp,
  send,
  test,
  error,
  children,
}: {
  title: string
  state: KeyState | undefined
  saveOp: string
  testOp: string
  placeholder: string
  envName: string
  busy: string | null
  lastOp: string | null
  send: Send
  test?: { ok: boolean; message: string }
  error: string
  children: React.ReactNode
}) {
  const [key, setKey] = useState('')
  const fromEnv = state?.source === 'env'
  const mine = lastOp === saveOp || lastOp === testOp

  const save = async (value: string) => {
    await send(saveOp, value)
    setKey('')
  }

  return (
    <Panel title={title}>
      <div className="flex flex-col gap-3 py-1">
        <div className="flex items-center gap-2">
          {state?.set ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-online/15 px-2.5 py-1 text-[11px] font-bold text-online">
                <Icon name="check" className="size-3" />
                설정됨
              </span>
              <code className="text-xs text-dim">{state.masked}</code>
              {fromEnv && <span className="text-[11px] text-dim">(서버 .env 값 사용 중)</span>}
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fbbf24]/15 px-2.5 py-1 text-[11px] font-bold text-[#fbbf24]">
              <Icon name="alert" className="size-3" />
              아직 없음
            </span>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-muted">{children}</p>

        {fromEnv ? (
          <p className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-dim">
            지금은 서버 파일(.env)에 넣은 값을 쓰고 있습니다. 화면에서 바꾸려면 서버의 {envName} 줄을
            지워야 합니다.
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-xl bg-white/6 px-3.5 py-2.5 font-mono text-xs outline-none placeholder:text-dim"
            />
            <button
              type="button"
              disabled={!key.trim() || busy !== null}
              onClick={() => void save(key)}
              className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold transition hover:bg-brand-bright disabled:opacity-40"
            >
              {busy === saveOp ? '저장 중…' : '저장'}
            </button>
          </div>
        )}

        {mine && error && <p className="text-[11px] text-[#f43f5e]">{error}</p>}

        {mine && test && (
          <p
            className={`flex gap-2 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed ${
              test.ok ? 'bg-online/10 text-online' : 'bg-[#f43f5e]/10 text-[#f43f5e]'
            }`}
          >
            <Icon name={test.ok ? 'check' : 'alert'} className="mt-0.5 size-3.5 shrink-0" />
            <span>{test.message}</span>
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!state?.set || busy !== null}
            onClick={() => void send(testOp)}
            className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3.5 py-2 text-[11px] font-bold transition hover:bg-white/14 disabled:opacity-40"
          >
            <Icon name="refresh" className="size-3.5" />
            {busy === testOp ? '확인 중…' : '연결 확인'}
          </button>
          {state?.set && !fromEnv && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                if (confirm('키를 지울까요? 이 게임 연동이 멈춥니다.')) void save('')
              }}
              className="rounded-xl bg-white/8 px-3.5 py-2 text-[11px] font-bold text-dim transition hover:bg-white/14"
            >
              키 지우기
            </button>
          )}
        </div>
      </div>
    </Panel>
  )
}

function RiotLookup({
  busy,
  send,
  lookup,
}: {
  busy: string | null
  send: Send
  lookup: Status['lookup']
}) {
  const [value, setValue] = useState('')
  const mine = busy === 'lookupRiot'
  const shown = lookup?.kind === 'riot' ? lookup : undefined

  return (
    <Panel title="라이엇 계정 조회 시험">
      <div className="flex flex-col gap-3 py-1">
        <p className="text-[11px] leading-relaxed text-muted">
          아무 라이엇 계정이나 넣어 <b className="text-white">라이엇이 실제로 무엇을 주는지</b>{' '}
          확인합니다. 저장하지 않고 누구에게도 붙이지 않습니다.
        </p>

        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="이름#태그 (예: 개미마왕#KR1)"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl bg-white/6 px-3.5 py-2.5 text-xs outline-none placeholder:text-dim"
          />
          <button
            type="button"
            disabled={!value.includes('#') || busy !== null}
            onClick={() => void send('lookupRiot', value)}
            className="shrink-0 rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14 disabled:opacity-40"
          >
            {mine ? '조회 중…' : '조회'}
          </button>
        </div>

        {shown &&
          (shown.ok ? (
            <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-white/5 px-3.5 py-3 text-[11px]">
              <dt className="text-dim">계정</dt>
              <dd className="font-bold">{shown.name}</dd>
              <dt className="text-dim">솔로랭크</dt>
              <dd className="font-bold">
                {shown.tier}
                {shown.lp ? ` ${shown.lp}LP` : ''} · {shown.record}
              </dd>
              <dt className="text-dim">주 포지션</dt>
              <dd>{shown.mainRole ?? '판별 못함'}</dd>
              <dt className="text-dim">챔피언</dt>
              <dd>{shown.champions}</dd>
              <dt className="text-dim">평균 KDA</dt>
              <dd>{shown.kda}</dd>
              <dt className="text-dim">본인 인증</dt>
              <dd className={shown.canVerify ? 'text-online' : 'text-[#fbbf24]'}>
                {shown.canVerify ? '가능' : '불가 (라이엇이 소환사 ID를 안 줌)'}
              </dd>
            </dl>
          ) : (
            <p className="rounded-xl bg-[#f43f5e]/10 px-3.5 py-2.5 text-[11px] text-[#f43f5e]">
              {shown.message}
            </p>
          ))}
      </div>
    </Panel>
  )
}

function NexonLookup({
  busy,
  send,
  lookup,
}: {
  busy: string | null
  send: Send
  lookup: Status['lookup']
}) {
  const [value, setValue] = useState('')
  const [game, setGame] = useState('fconline')
  const mine = busy === 'lookupNexon'
  const shown = lookup?.kind === 'nexon' ? lookup : undefined

  return (
    <Panel title="넥슨 계정 조회 시험">
      <div className="flex flex-col gap-3 py-1">
        <p className="text-[11px] leading-relaxed text-muted">
          FC 온라인은 <b className="text-white">감독명</b>, 메이플은{' '}
          <b className="text-white">캐릭터명</b>을 넣습니다. 저장하지 않습니다.
        </p>

        <div className="flex gap-2">
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="shrink-0 rounded-xl bg-white/6 px-3 py-2.5 text-xs outline-none [color-scheme:dark]"
          >
            <option value="fconline" className="bg-[#14141d]">
              FC 온라인
            </option>
            <option value="maple" className="bg-[#14141d]">
              메이플
            </option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={game === 'maple' ? '캐릭터명' : '감독명'}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl bg-white/6 px-3.5 py-2.5 text-xs outline-none placeholder:text-dim"
          />
          <button
            type="button"
            disabled={!value.trim() || busy !== null}
            onClick={() => void send('lookupNexon', value, game)}
            className="shrink-0 rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14 disabled:opacity-40"
          >
            {mine ? '조회 중…' : '조회'}
          </button>
        </div>

        {shown &&
          (shown.ok ? (
            <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-white/5 px-3.5 py-3 text-[11px]">
              <dt className="text-dim">계정</dt>
              <dd className="font-bold">{shown.name}</dd>
              <dt className="text-dim">등급</dt>
              <dd className="font-bold">{shown.tier}</dd>
              <dt className="text-dim">한 줄 요약</dt>
              <dd>{shown.record}</dd>
              <dt className="text-dim">원본 값</dt>
              <dd className="font-mono break-all">{shown.kda}</dd>
            </dl>
          ) : (
            <p className="rounded-xl bg-[#f43f5e]/10 px-3.5 py-2.5 text-[11px] text-[#f43f5e]">
              {shown.message}
            </p>
          ))}
      </div>
    </Panel>
  )
}

function PubgLookup({
  busy,
  send,
  lookup,
}: {
  busy: string | null
  send: Send
  lookup: Status['lookup']
}) {
  const [value, setValue] = useState('')
  const [platform, setPlatform] = useState('kakao')
  const mine = busy === 'lookupPubg'
  const shown = lookup?.kind === 'pubg' ? lookup : undefined

  return (
    <Panel title="배그 계정 조회 시험">
      <div className="flex flex-col gap-3 py-1">
        <p className="text-[11px] leading-relaxed text-muted">
          배그 닉네임을 넣어 랭크 정보가 제대로 나오는지 확인합니다. 저장하지 않습니다. 닉네임은{' '}
          <b className="text-white">대소문자를 가립니다.</b>
        </p>

        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="shrink-0 rounded-xl bg-white/6 px-3 py-2.5 text-xs outline-none [color-scheme:dark]"
          >
            <option value="kakao" className="bg-[#14141d]">
              카카오
            </option>
            <option value="steam" className="bg-[#14141d]">
              스팀
            </option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="배그 닉네임"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl bg-white/6 px-3.5 py-2.5 text-xs outline-none placeholder:text-dim"
          />
          <button
            type="button"
            disabled={!value.trim() || busy !== null}
            onClick={() => void send('lookupPubg', value, platform)}
            className="shrink-0 rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14 disabled:opacity-40"
          >
            {mine ? '조회 중…' : '조회'}
          </button>
        </div>

        {shown &&
          (shown.ok ? (
            <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-white/5 px-3.5 py-3 text-[11px]">
              <dt className="text-dim">계정</dt>
              <dd className="font-bold">{shown.name}</dd>
              <dt className="text-dim">티어</dt>
              <dd className="font-bold">{shown.tier}</dd>
              <dt className="text-dim">전적</dt>
              <dd>{shown.record}</dd>
              <dt className="text-dim">기록</dt>
              <dd>{shown.kda}</dd>
            </dl>
          ) : (
            <p className="rounded-xl bg-[#f43f5e]/10 px-3.5 py-2.5 text-[11px] text-[#f43f5e]">
              {shown.message}
            </p>
          ))}
      </div>
    </Panel>
  )
}
