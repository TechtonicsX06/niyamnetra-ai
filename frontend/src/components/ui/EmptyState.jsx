export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-white/70 px-6 py-10 text-center">
      <h3 className="font-display text-2xl text-navy-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
