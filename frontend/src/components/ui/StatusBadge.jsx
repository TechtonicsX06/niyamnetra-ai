import { SCREENING_STATUS } from '../../utils/constants.js'

const styles = {
  pass: 'bg-emerald-50 text-status-pass border-emerald-200',
  warn: 'bg-orange-50 text-status-warn border-orange-200',
  review: 'bg-blue-50 text-status-review border-blue-200',
  critical: 'bg-red-50 text-status-critical border-red-200',
}

export default function StatusBadge({ status, size = 'md' }) {
  const meta = typeof status === 'string' ? SCREENING_STATUS[status] || SCREENING_STATUS.REVIEW : status
  const pad = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-[11px]'
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${pad} ${styles[meta.tone]}`}>
      {meta.label}
    </span>
  )
}
