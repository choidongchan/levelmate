'use client'

import { useState } from 'react'
import { PageTitle, Panel, Tag } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import {
  createAdmin,
  currentAdmin,
  deleteAdmin,
  updateAdmin,
  useStore,
} from '@/lib/store'
import type { AdminAccount } from '@/lib/types'

export default function AdminAccountsPage() {
  const s = useStore()
  const me = currentAdmin(s)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [error, setError] = useState('')

  return (
    <>
      <PageTitle title="관리자 계정" desc="추가 · 수정 · 삭제" />

      <p className="mb-4 flex gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-dim" />
        <span>
          비밀번호는 서버에 <b className="text-white">해시로만</b> 남습니다. 다시 꺼내 볼 수 없으니
          잊으면 여기서 새로 정해야 합니다. 비밀번호를 바꾸면 그 계정의 다른 로그인은 모두 끊깁니다.
        </span>
      </p>

      <Panel
        title={`관리자 ${s.admins.length}명`}
        action={
          <button
            type="button"
            onClick={() => {
              setAdding((v) => !v)
              setError('')
              setForm({ username: '', password: '', name: '' })
            }}
            className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold transition hover:bg-brand-bright"
          >
            {adding ? '취소' : '계정 추가'}
          </button>
        }
      >
        {adding && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl bg-white/4 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Field label="아이디">
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </Field>
              <Field label="비밀번호">
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="off"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </Field>
              <Field label="표시 이름">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="운영팀 김OO"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
                />
              </Field>
            </div>

            {error && <p className="px-1 text-xs text-[#f43f5e]">{error}</p>}

            <button
              type="button"
              onClick={async () => {
                const err = await createAdmin(form)
                if (err) return setError(err)
                setAdding(false)
                setForm({ username: '', password: '', name: '' })
                setError('')
              }}
              className="rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
            >
              추가
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {s.admins.map((a) => (
            <Row
              key={a.id}
              admin={a}
              isMe={me?.id === a.id}
              open={openId === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
            />
          ))}
        </div>
      </Panel>
    </>
  )
}

function Row({
  admin,
  isMe,
  open,
  onToggle,
}: {
  admin: AdminAccount
  isMe: boolean
  open: boolean
  onToggle: () => void
}) {
  const [d, setD] = useState({ name: admin.name, password: '' })

  return (
    <div className="rounded-xl border border-line bg-white/3 p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-bold">{admin.username}</span>
        <span className="text-xs text-muted">{admin.name}</span>
        {admin.owner && <Tag color="#a855f7">최고 관리자</Tag>}
        {isMe && <Tag color="#22d3ee">현재 로그인</Tag>}
        {!admin.active && <Tag color="#6a6a86">비활성</Tag>}

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
          >
            {open ? '닫기' : '수정'}
          </button>
          {!admin.owner && (
            <>
              <button
                type="button"
                onClick={() => updateAdmin(admin.id, { active: !admin.active })}
                className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
              >
                {admin.active ? '비활성' : '활성'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`${admin.username} 계정을 삭제할까요?`)) deleteAdmin(admin.id)
                }}
                aria-label="계정 삭제"
                className="grid size-7 place-items-center rounded-full bg-[#f43f5e]/15 text-[#f43f5e] transition hover:bg-[#f43f5e]/25"
              >
                <Icon name="trash" className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-[10px] text-dim">
        {new Date(admin.createdAt).toLocaleDateString('ko-KR')} 생성 ·{' '}
        {admin.lastLoginAt
          ? `최근 로그인 ${new Date(admin.lastLoginAt).toLocaleString('ko-KR')}`
          : '로그인 기록 없음'}
      </p>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="표시 이름">
              <input
                value={d.name}
                onChange={(e) => setD({ ...d, name: e.target.value })}
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>
            <Field label="새 비밀번호 (바꿀 때만)">
              <input
                type="password"
                value={d.password}
                onChange={(e) => setD({ ...d, password: e.target.value })}
                placeholder="그대로 두려면 비워두세요"
                autoComplete="new-password"
                className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={async () => {
              await updateAdmin(admin.id, {
                name: d.name.trim() || admin.name,
                ...(d.password ? { password: d.password } : {}),
              })
              setD({ name: d.name, password: '' })
              onToggle()
            }}
            className="rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
          >
            저장
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl bg-white/5 px-3.5 py-2.5">
      <span className="block text-[10px] text-dim">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  )
}
