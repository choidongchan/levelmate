'use client'

import { useState } from 'react'
import { PageTitle, StatCard, Tag } from '@/components/admin-ui'
import { Icon } from '@/components/icon'
import { won } from '@/lib/format'
import { updatePlan, useStore } from '@/lib/store'
import { PLAN_TARGETS, type Plan, type PlanTarget } from '@/lib/types'

export default function AdminPlansPage() {
  const s = useStore()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <PageTitle title="요금제" desc="아직 확정 전입니다. 뼈대만 잡아두고 여기서 바로 고칩니다." />

      <p className="mb-4 flex gap-2 rounded-2xl border border-[#fbbf24]/25 bg-[#fbbf24]/8 px-4 py-3 text-[11px] leading-relaxed text-muted">
        <Icon name="info" className="mt-0.5 size-3.5 shrink-0 text-[#fbbf24]" />
        <span>
          요금과 정책이 정해지지 않아 <b className="text-white">비활성</b> 상태로 둔 것들이 있습니다.
          결제를 붙일 때 이 값들이 그대로 쓰입니다.
        </span>
      </p>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {(Object.keys(PLAN_TARGETS) as PlanTarget[]).map((t) => (
          <StatCard
            key={t}
            label={PLAN_TARGETS[t]}
            value={`${s.plans.filter((p) => p.target === t).length}개`}
            sub={`활성 ${s.plans.filter((p) => p.target === t && p.active).length}`}
          />
        ))}
      </div>

      <div className="grid gap-2.5 xl:grid-cols-2">
        {s.plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            open={openId === p.id}
            onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          />
        ))}
      </div>
    </>
  )
}

function PlanCard({
  plan,
  open,
  onToggle,
}: {
  plan: Plan
  open: boolean
  onToggle: () => void
}) {
  const [d, setD] = useState({
    name: plan.name,
    monthly: plan.monthly,
    feeRate: Math.round(plan.feeRate * 100),
    features: plan.features.join('\n'),
    note: plan.note,
  })

  return (
    <div
      className={`rounded-2xl border p-4 ${
        plan.active ? 'border-brand/40 bg-brand/5' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        <Tag color="#9797b4">{PLAN_TARGETS[plan.target]}</Tag>
        <span className="text-sm font-bold">{plan.name}</span>
        <Tag color={plan.active ? '#34d399' : '#6a6a86'}>{plan.active ? '활성' : '비활성'}</Tag>
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto shrink-0 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/14"
        >
          {open ? '닫기' : '수정'}
        </button>
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-xl font-black tracking-tight">
          {plan.monthly === 0 ? '무료' : `${won(plan.monthly)}`}
          {plan.monthly > 0 && <span className="text-xs font-medium text-dim"> /월</span>}
        </span>
        <span className="text-xs text-muted">
          중개 수수료 <b className="text-brand-bright">{Math.round(plan.feeRate * 100)}%</b>
        </span>
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="rounded-full border border-line bg-white/4 px-2.5 py-1 text-[11px] text-muted"
          >
            {f}
          </li>
        ))}
      </ul>

      {plan.note && <p className="mt-2 text-[11px] text-dim">메모: {plan.note}</p>}

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <Field label="이름">
            <input
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="w-full bg-transparent text-sm outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="월 요금 (0이면 무료)">
              <input
                type="number"
                min={0}
                step={1000}
                value={d.monthly}
                onChange={(e) => setD({ ...d, monthly: Number(e.target.value) })}
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>
            <Field label="중개 수수료 (%)">
              <input
                type="number"
                min={0}
                max={100}
                value={d.feeRate}
                onChange={(e) => setD({ ...d, feeRate: Number(e.target.value) })}
                className="w-full bg-transparent text-sm outline-none"
              />
            </Field>
          </div>

          <Field label="제공 항목 (한 줄에 하나)">
            <textarea
              value={d.features}
              onChange={(e) => setD({ ...d, features: e.target.value })}
              rows={4}
              className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
            />
          </Field>

          <Field label="메모">
            <input
              value={d.note}
              onChange={(e) => setD({ ...d, note: e.target.value })}
              placeholder="검토 중 / 요금 미확정 등"
              className="w-full bg-transparent text-sm outline-none placeholder:text-dim"
            />
          </Field>

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => {
                updatePlan(plan.id, {
                  name: d.name.trim() || plan.name,
                  monthly: Math.max(0, d.monthly),
                  feeRate: Math.min(1, Math.max(0, d.feeRate / 100)),
                  features: d.features.split('\n').map((x) => x.trim()).filter(Boolean),
                  note: d.note,
                })
                onToggle()
              }}
              className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold transition hover:bg-brand-bright"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => updatePlan(plan.id, { active: !plan.active })}
              className="rounded-xl bg-white/8 px-4 py-2.5 text-xs font-bold transition hover:bg-white/14"
            >
              {plan.active ? '비활성으로' : '활성으로'}
            </button>
          </div>
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
