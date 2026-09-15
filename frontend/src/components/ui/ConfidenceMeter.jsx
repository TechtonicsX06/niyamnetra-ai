const tones = {
  pass: 'text-status-pass',
  warn: 'text-status-warn',
  review: 'text-status-review',
  critical: 'text-status-critical',
}

export default function ConfidenceMeter({ value = 0, compact = false }) {
  const pct = Math.round((value || 0) * 100)
  const tone = value >= 0.85 ? 'pass' : value >= 0.6 ? 'warn' : 'critical'
  const label = value >= 0.85 ? 'High Confidence' : value >= 0.6 ? 'Medium Confidence' : 'Low Confidence'
  return (
    <div className={compact ? 'min-w-[120px]' : 'w-full'}>
      {!compact && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className={`font-semibold ${tones[tone]}`}>{label}</span>
          <span className="font-mono text-ink-600">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${tone === 'pass' ? 'bg-teal-600' : tone === 'warn' ? 'bg-orange-500' : 'bg-red-600'}`} style={{ width: `${pct}%` }} />
      </div>
      {compact && <p className={`mt-1 text-[11px] font-medium ${tones[tone]}`}>{label} · {pct}%</p>}
    </div>
  )
}
