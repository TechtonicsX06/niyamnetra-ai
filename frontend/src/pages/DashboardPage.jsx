import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Eye, Plus } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { dashboardStats, recentScans } from '../data/mockScans.js'

const cards = [
  { label: 'Total Products Scanned', value: dashboardStats.total, hint: 'Prototype caseload', icon: ClipboardList, tone: 'text-navy-700' },
  { label: 'Preliminary Checks Passed', value: dashboardStats.passed, hint: 'Green band', icon: CheckCircle2, tone: 'text-status-pass' },
  { label: 'Potential Issues', value: dashboardStats.issues, hint: 'Orange band', icon: AlertTriangle, tone: 'text-status-warn' },
  { label: 'Needs Manual Review', value: dashboardStats.review, hint: 'Blue band', icon: Eye, tone: 'text-status-review' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Operations</p>
          <h1 className="mt-1 font-display text-4xl text-navy-900">Screening dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Overview of preliminary packaged commodity screening. Figures below are demo-mode analytics for SIH
            walkthroughs.
          </p>
        </div>
        <Link to="/scan" className="btn-primary">
          <Plus className="h-4 w-4" /> Start New Scan
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="glass rounded-2xl p-5 shadow-card">
            <div className="flex items-start justify-between">
              <p className="text-sm text-ink-600">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.tone}`} />
            </div>
            <p className="mt-4 font-display text-4xl text-navy-900">{card.value.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-xs text-ink-400">{card.hint}</p>
          </article>
        ))}
      </div>

      <section className="glass rounded-2xl p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy-900">Recent scans</h2>
          <span className="text-xs uppercase tracking-wider text-ink-400">Demo products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-ink-400">
              <tr className="border-b border-ink-100">
                <th className="pb-3 font-medium">Scan ID</th>
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan) => (
                <tr key={scan.id} className="border-b border-ink-100/80 last:border-0">
                  <td className="py-3 font-mono text-xs text-navy-700">{scan.id}</td>
                  <td className="py-3">
                    <p className="font-medium text-navy-900">{scan.productName}</p>
                    <p className="text-xs text-ink-400">{scan.brand}</p>
                  </td>
                  <td className="py-3 font-mono">{scan.score}</td>
                  <td className="py-3">
                    <StatusBadge status={scan.overall} />
                  </td>
                  <td className="py-3 text-right">
                    <Link to={`/results/${scan.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
                      Open <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
