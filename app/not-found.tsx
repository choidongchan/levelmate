import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-4xl font-bold text-brand-bright">404</p>
      <p className="text-sm text-muted">찾을 수 없는 페이지예요</p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-bright"
      >
        홈으로
      </Link>
    </main>
  )
}
