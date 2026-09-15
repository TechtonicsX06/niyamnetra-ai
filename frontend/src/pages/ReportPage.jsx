import { Link, useParams } from 'react-router-dom'
import DisclaimerBanner from '../components/ui/DisclaimerBanner.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { fetchScan } from '../services/screeningService.js'

export default function ReportPage() {
  const { scanId } = useParams()
  const scan = fetchScan(scanId)

  if (!scan) {
    return (
      <EmptyState title="Report unavailable" action={<Link to="/dashboard" className="btn-primary">Dashboard</Link>}>
        No screening record found for this ID.
      </EmptyState>
    )
  }

  const handlePrint = () => window.print()

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/results/${scan.id}`} className="text-sm font-semibold text-navy-700">
          ← Back to results
        </Link>
        <button type="button" className="btn-primary" onClick={handlePrint}>
          Download / Print PDF
        </button>
      </div>

      <article className="rounded-2xl border border-ink-100 bg-white p-8 shadow-card">
        <p className="section-kicker">NIYAMNETRA AI</p>
        <h1 className="mt-2 font-display text-3xl text-navy-900">
          Packaged Commodity Preliminary Compliance Screening Report
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-600">
          <span>Scan ID: {scan.id}</span>
          <span>{new Date(scan.createdAt).toLocaleString('en-IN')}</span>
          <StatusBadge status={scan.overall} />
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">1. Product summary</h2>
          <p className="mt-2 text-sm">
            {scan.productName} · {scan.brand} · {scan.category} · Score {scan.score}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">2. Uploaded images</h2>
          <p className="mt-2 text-sm">{scan.images.map((img) => img.role).join(' · ')}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">3. Extracted information</h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {Object.entries(scan.declarations)
              .filter(([, v]) => v.value)
              .map(([k, v]) => (
                <li key={k}>
                  <span className="text-ink-400">{k.replaceAll('_', ' ')}:</span> {v.value}
                </li>
              ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">4. Validation results</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {scan.ruleResults.map((r) => (
              <li key={r.rule_id}>
                {r.rule_id} {r.rule_name} — {r.status}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">5. Potential issues</h2>
          {scan.issues.length === 0 ? (
            <p className="mt-2 text-sm">None flagged by the current rule set.</p>
          ) : (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {scan.issues.map((i) => (
                <li key={i.title}>{i.title}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">6–8. Evidence, confidence, recommendations</h2>
          <p className="mt-2 text-sm">{scan.explanation}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {scan.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">9. Review status</h2>
          <p className="mt-2 text-sm">Pending authorized personnel review (session-local).</p>
        </section>

        <div className="mt-8">
          <DisclaimerBanner />
        </div>
      </article>
    </div>
  )
}
