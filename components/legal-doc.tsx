import { ScreenHeader } from './screen-header'

/**
 * 약관·처리방침처럼 긴 글을 읽기 좋게 담는 틀.
 *
 * 이런 문서는 안 읽히기로 유명하지만, 그래도 읽으려는 사람은 읽는다.
 * 글자를 너무 작게 하지 않고 조항 사이를 넉넉히 띄운다.
 */
export function LegalPage({
  title,
  effective,
  children,
}: {
  title: string
  effective: string
  children: React.ReactNode
}) {
  return (
    <>
      <ScreenHeader title={title} />
      <main className="flex flex-col gap-5 px-5 pt-1 pb-8 md:max-w-3xl">
        <p className="text-xs text-dim">시행일: {effective}</p>
        {children}
      </main>
    </>
  )
}

export function Article({
  no,
  title,
  children,
}: {
  no: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-bold">
        {no} ({title})
      </h2>
      <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted">{children}</div>
    </section>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[13px] font-bold">{title}</h2>
      <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted">{children}</div>
    </section>
  )
}

/** 항·호 목록 */
export function Items({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1.5 pl-4">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  )
}

/** 표 — 수집 항목, 보유 기간처럼 줄 맞춰 보여야 하는 것 */
export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-[11px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-line px-2 py-2 text-left font-bold whitespace-nowrap text-white"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-b border-line px-2 py-2 align-top leading-relaxed">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
