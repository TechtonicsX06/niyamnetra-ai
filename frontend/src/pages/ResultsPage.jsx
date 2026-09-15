import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, ImageIcon, StickyNote } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import ConfidenceMeter from '../components/ui/ConfidenceMeter.jsx'
import DisclaimerBanner from '../components/ui/DisclaimerBanner.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { fetchScan } from '../services/screeningService.js'
import { confidenceLabel } from '../utils/constants.js'

const FIELD_GROUPS = [
  {
    title: 'Product information',
    keys: [
      ['product_name', 'Product Name'],
      ['brand', 'Brand'],
      ['category', 'Category'],
    ],
  },
  {
    title: 'Manufacturer information',
    keys: [
      ['manufacturer', 'Manufacturer Name'],
      ['packer', 'Packer Name'],
      ['importer', 'Importer Name'],
      ['address', 'Address'],
    ],
  },
  {
    title: 'Packaging & price',
    keys: [
      ['net_quantity', 'Net Quantity'],
      ['unit', 'Unit'],
      ['mrp', 'MRP'],
      ['currency', 'Currency'],
    ],
  },
  {
    title: 'Dates & consumer care',
    keys: [
      ['mfg_date', 'Manufacturing Date'],
      ['packing_date', 'Packing Date'],
      ['customer_care', 'Customer Care'],
      ['phone', 'Phone'],
      ['email', 'Email'],
    ],
  },
  {
    title: 'Other declarations',
    keys: [
      ['country_of_origin', 'Country of Origin'],
      ['batch', 'Batch Number'],
      ['license', 'License Number'],
    ],
  },
]

const ruleTone = {
  PASS: 'text-status-pass bg-emerald-50 border-emerald-200',
  WARNING: 'text-status-warn bg-orange-50 border-orange-200',
  FAIL: 'text-status-critical bg-red-50 border-red-200',
  REVIEW: 'text-status-review bg-blue-50 border-blue-200',
}

export default function ResultsPage() {
  const { scanId } = useParams()
  const scan = fetchScan(scanId)
  const [draft, setDraft] = useState(() => scan?.declarations || {})
  const [notes, setNotes] = useState(scan?.review?.notes || '')
  const [reviewed, setReviewed] = useState(false)
  const [confirmed, setConfirmed] = useState({})

  const selectedEvidence = useMemo(() => {
    if (!scan) return null
    return Object.entries(scan.declarations).find(([, v]) => v?.evidence)
  }, [scan])

  if (!scan) {
    return (
      <EmptyState title="Scan not found" action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>}>
        The requested screening ID is not in the demo dataset.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Screening result</p>
          <h1 className="mt-1 font-display text-4xl text-navy-900">{scan.overall.label}</h1>
          <p className="mt-2 text-sm text-ink-600">
            {scan.productName} · {scan.id} · {new Date(scan.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={scan.overall} size="lg" />
          <Link to={`/report/${scan.id}`} className="btn-secondary">
            <Download className="h-4 w-4" /> Preview report
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass rounded-2xl p-5 shadow-card md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-ink-400">Compliance score</p>
          <p className="mt-2 font-display text-6xl text-navy-900">{scan.score}</p>
          <p className="text-sm text-ink-500">Preliminary screening index (0–100)</p>
          <div className="mt-4">
            <ConfidenceMeter value={scan.ocrConfidence} />
            <p className="mt-1 text-xs text-ink-400">OCR confidence across uploaded faces</p>
          </div>
        </article>
        <article className="glass rounded-2xl p-5 shadow-card md:col-span-2">
          <p className="text-xs uppercase tracking-wider text-ink-400">AI-assisted explanation</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">{scan.explanation}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-600">
            {scan.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <DisclaimerBanner />

      {scan.quality?.warning && (
        <p className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-status-warn">
          Image quality may affect text extraction. Low-confidence fields should be reviewed manually.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-navy-900">Extracted information</h2>
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
            <div className="border-b border-ink-100 bg-ink-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              {group.title}
            </div>
            <div className="divide-y divide-ink-100">
              {group.keys.map(([key, label]) => {
                const item = draft[key] || { value: '', confidence: 0 }
                return (
                  <div key={key} className="grid gap-3 px-4 py-3 md:grid-cols-[180px_1fr_160px]">
                    <p className="text-sm font-medium text-navy-800">{label}</p>
                    <input
                      className="rounded-md border border-ink-200 px-3 py-1.5 text-sm"
                      value={item.value || ''}
                      placeholder="Not detected"
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [key]: { ...item, value: e.target.value } }))
                      }
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-ink-500">{confidenceLabel(item.confidence || 0)}</span>
                      <label className="flex items-center gap-1 text-xs text-ink-500">
                        <input
                          type="checkbox"
                          checked={!!confirmed[key]}
                          onChange={(e) => setConfirmed((c) => ({ ...c, [key]: e.target.checked }))}
                        />
                        Confirm
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-2xl text-navy-900">Rule validation</h2>
          <ul className="mt-4 space-y-2">
            {scan.ruleResults.map((rule) => (
              <li key={rule.rule_id} className="rounded-lg border border-ink-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-900">{rule.rule_name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ruleTone[rule.status]}`}>
                    {rule.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {rule.rule_id} · Evidence: {rule.evidence}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">
                  Source: {rule.source} · {Math.round(rule.confidence * 100)}%
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <h2 className="font-display text-2xl text-navy-900">Potential issues</h2>
            {scan.issues.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">No automated gaps were flagged for the current rule set.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {scan.issues.map((issue) => (
                  <li key={issue.title} className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
                    <p className="text-sm font-semibold text-navy-900">{issue.title}</p>
                    <p className="mt-1 text-xs text-ink-600">{issue.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-2xl text-navy-900">
              <ImageIcon className="h-5 w-5" /> Evidence panel
            </h2>
            {selectedEvidence ? (
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="text-ink-400">Field · </span>
                  {selectedEvidence[0].replaceAll('_', ' ')}
                </p>
                <p>
                  <span className="text-ink-400">Extracted value · </span>
                  {selectedEvidence[1].value}
                </p>
                <p>
                  <span className="text-ink-400">Evidence · </span>
                  “{selectedEvidence[1].evidence}”
                </p>
                <p>
                  <span className="text-ink-400">Source · </span>
                  {selectedEvidence[1].source}
                </p>
                <div className="pt-2">
                  <ConfidenceMeter value={selectedEvidence[1].confidence} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-600">No high-confidence evidence snippet available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-2xl text-navy-900">
          <StickyNote className="h-5 w-5" /> Human review
        </h2>
        <textarea
          className="mt-3 w-full rounded-lg border border-ink-200 p-3 text-sm"
          rows={4}
          placeholder="Add inspector notes, mark false positives, or record follow-up actions…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setReviewed(true)}>
            Mark case as reviewed
          </button>
          {reviewed && <span className="self-center text-sm font-medium text-status-pass">Review recorded in this session.</span>}
        </div>
      </section>
    </div>
  )
}
