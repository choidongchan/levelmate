export function OnlineDot({ online, label = true }: { online: boolean; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span
        className={`size-1.5 rounded-full ${online ? 'bg-online online-dot' : 'bg-dim'}`}
      />
      {label && (
        <span className={online ? 'text-online' : 'text-dim'}>
          {online ? '온라인' : '오프라인'}
        </span>
      )}
    </span>
  )
}
