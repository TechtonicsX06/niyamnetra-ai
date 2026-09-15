import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { pickDemoFromImageCount, resolveDemoScan } from '../services/screeningService.js'
import { useScanSession } from '../hooks/useScanSession.jsx'
import { IMAGE_STATUS } from '../utils/constants.js'

const STEPS = [
  'Uploading',
  'Image Quality Analysis',
  'OCR Processing',
  'Extracting Declarations',
  'Validating Rules',
  'Generating Results',
]

export default function ProcessingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pendingImages } = useScanSession()
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((step) => Math.min(step + 1, STEPS.length))
    }, 900)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (active < STEPS.length) return
    const demo = params.get('demo')
    const uploaded = pendingImages.filter((img) => img.status === IMAGE_STATUS.VALID || !img.status)
    const qualityWarning = uploaded.some((img) => img.quality?.warning)
    const scanId = demo
      ? resolveDemoScan(demo).id
      : pickDemoFromImageCount(uploaded.length || 3, qualityWarning)
    const t = setTimeout(() => navigate(`/results/${scanId}`), 600)
    return () => clearTimeout(t)
  }, [active, navigate, params, pendingImages])

  return (
    <div className="mx-auto max-w-2xl py-6">
      <p className="section-kicker">Pipeline</p>
      <h1 className="mt-1 font-display text-4xl text-navy-900">Processing screening case</h1>
      <p className="mt-2 text-sm text-ink-600">
        Running quality analysis, text extraction, declaration structuring, and rule validation.
      </p>

      <ol className="mt-10 space-y-3">
        {STEPS.map((label, index) => {
          const done = index < active
          const current = index === active
          return (
            <li
              key={label}
              className={`flex items-center gap-4 rounded-xl border px-4 py-4 ${
                current ? 'border-gold-500 bg-white shadow-card' : 'border-ink-100 bg-white/70'
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${
                  done ? 'bg-teal-700 text-white' : current ? 'bg-navy-800 text-white' : 'bg-ink-100 text-ink-400'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : current ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}
              </span>
              <div>
                <p className="font-semibold text-navy-900">{label}</p>
                <p className="text-xs text-ink-400">
                  {done ? 'Complete' : current ? 'In progress' : 'Queued'}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
