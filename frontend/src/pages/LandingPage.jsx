import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  Layers,
  ScanSearch,
  Shield,
  Sparkles,
  Scale,
  Workflow,
} from 'lucide-react'
import BrandMark from '../components/layout/BrandMark.jsx'

const steps = [
  { title: 'Upload images', copy: 'Capture front, back, and side panels of the package.' },
  { title: 'Quality & OCR', copy: 'Screen image quality, then extract visible text.' },
  { title: 'Extract declarations', copy: 'Structure product, quantity, MRP, manufacturer, and care details.' },
  { title: 'Validate & review', copy: 'Run a configurable rule engine and recommend human review.' },
]

const features = [
  { icon: Camera, title: 'Multi-image capture', copy: 'Front, back, side, and additional packaging faces in one case.' },
  { icon: ScanSearch, title: 'OCR + structured extraction', copy: 'Visible text is converted into field-level declarations with evidence.' },
  { icon: Scale, title: 'Configurable rule engine', copy: 'Deterministic PASS / WARNING / FAIL / REVIEW outcomes — not an LLM verdict.' },
  { icon: Shield, title: 'Evidence & confidence', copy: 'Every finding is tied to source text, image face, and confidence band.' },
  { icon: FileText, title: 'Screening reports', copy: 'Downloadable preliminary reports for inspectors and compliance teams.' },
  { icon: Sparkles, title: 'Human-in-the-loop', copy: 'Edit, confirm, annotate, and mark cases reviewed before any action.' },
]

export default function LandingPage() {
  return (
    <div className="bg-navy-950 text-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <BrandMark inverted />
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline">
              Dashboard
            </Link>
            <Link to="/scan" className="btn-primary !bg-gold-500 !text-navy-950 hover:!bg-gold-400">
              Start Screening
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-mesh" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="section-kicker text-gold-400">Smart India Hackathon · Legal Metrology Support</p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              AI-Powered Packaged Commodity Compliance Screening
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Scan. Extract. Validate. Review. Assist inspectors with OCR, structured declarations, and a deterministic
              rule engine — without replacing human authority.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/scan" className="btn-primary !bg-gold-500 !px-6 !py-3 !text-navy-950 hover:!bg-gold-400">
                Start Screening <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dashboard" className="btn-secondary !border-white/20 !bg-white/5 !text-white hover:!bg-white/10">
                View Demo Dashboard
              </Link>
            </div>
            <p className="mt-6 max-w-lg text-xs leading-relaxed text-white/50">
              Preliminary compliance screening only. Results must be reviewed by authorized personnel before any legal
              or enforcement decision.
            </p>
          </div>

          <div className="glass-dark rounded-2xl p-5 shadow-glow">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-gold-400/90">
              <span>Live screening preview</span>
              <span>Scan NN-2026-10482</span>
            </div>
            <div className="rounded-xl bg-navy-950/60 p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">Green</p>
              <h2 className="mt-1 font-display text-3xl">Preliminary Checks Passed</h2>
              <p className="mt-2 text-sm text-white/60">Annapurna Wheat Flour · Score 92</p>
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Net Quantity', '5 kg'],
                  ['MRP', '₹248.00'],
                  ['Manufacturer', 'Annapurna Foods'],
                  ['Consumer Care', '1800-120-4455'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <dt className="text-[11px] text-white/50">{k}</dt>
                    <dd className="mt-1 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="border-t border-white/10 bg-navy-900 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="section-kicker text-gold-400">The problem</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Manual label inspection does not scale.</h2>
            <p className="mt-4 text-white/70">
              Packaged commodities carry mandatory declarations — product name, manufacturer, net quantity, MRP, dates,
              and consumer care. Officers face high volumes, small type, mixed languages, and uneven photo quality.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              'Large product volumes in markets and warehouses',
              'Dense multilingual label text',
              'Multiple package faces required',
              'Blur, glare, and low-resolution captures',
            ].map((item) => (
              <li key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="section-kicker text-gold-400">How it works</p>
          <h2 className="mt-3 font-display text-4xl">A transparent screening pipeline</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, i) => (
              <article key={step.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="font-mono text-xs text-gold-400">0{i + 1}</p>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-white/65">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-navy-900 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="section-kicker text-gold-400">Capabilities</p>
          <h2 className="mt-3 font-display text-4xl">Built for inspectors, usable by industry</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="rounded-xl border border-white/10 bg-navy-950/40 p-5">
                <f.icon className="h-5 w-5 text-gold-400" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-white/65">{f.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="technology" className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-kicker text-gold-400">Technology</p>
            <h2 className="mt-3 font-display text-4xl">Deterministic rules first. AI second.</h2>
            <p className="mt-4 text-white/70">
              OCR (Tesseract.js, with a path to cloud providers), hybrid extraction (regex, keywords, patterns), a
              JSON-configured rule engine, and an optional LLM layer for explanations only.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/75">
              {['React + Vite + Tailwind', 'Node.js / Express architecture', 'Modular OCR & AI providers', 'Local demo data without API keys'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <Workflow className="h-6 w-6 text-gold-400" />
            <p className="mt-4 font-mono text-xs leading-7 text-white/70">
              Upload → Quality → OCR → Extraction → Rules → Explanation → Human review → Report
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Tesseract.js', 'Rule JSON', 'Evidence graph', 'PDF report'].map((chip) => (
                <span key={chip} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="border-t border-white/10 bg-navy-900 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="section-kicker text-gold-400">Impact</p>
          <h2 className="mt-3 font-display text-4xl">Faster screening. Clearer evidence. Human final say.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { k: 'Officers', v: 'Prioritize cases with missing or low-confidence declarations.' },
              { k: 'Industry', v: 'Self-check packaging before market placement.' },
              { k: 'Public trust', v: 'Transparent, auditable preliminary screening — never a silent verdict.' },
            ].map((item) => (
              <article key={item.k} className="rounded-xl border border-white/10 p-5">
                <Layers className="h-5 w-5 text-gold-400" />
                <h3 className="mt-4 font-semibold">{item.k}</h3>
                <p className="mt-2 text-sm text-white/65">{item.v}</p>
              </article>
            ))}
          </div>
          <Link to="/scan" className="btn-primary mt-10 !bg-gold-500 !text-navy-950 hover:!bg-gold-400">
            Start Screening <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/40 sm:px-6">
        NIYAMNETRA AI · Packaged Commodity Preliminary Compliance Screening · Decision-support prototype
      </footer>
    </div>
  )
}
