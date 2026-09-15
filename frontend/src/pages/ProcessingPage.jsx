import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { resolveDemoScan } from '../services/screeningService.js'
import { recognizeImages } from '../services/ocrService.js'
import { useScanSession } from '../hooks/useScanSession.jsx'
import { IMAGE_STATUS } from '../utils/constants.js'

const DEMO_STEPS = [
  'Uploading',
  'Image Quality Analysis',
  'OCR Processing',
  'Extracting Declarations',
  'Validating Rules',
  'Generating Results',
]

function formatPct(progress) {
  const value = typeof progress === 'number' ? progress : 0
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`
}

export default function ProcessingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pendingImages, setOcrResults } = useScanSession()
  const demoKey = params.get('demo')
  const isDemo = Boolean(demoKey)
  const isUpload = params.get('source') === 'upload' || (!isDemo && pendingImages.length > 0)

  const [active, setActive] = useState(0)
  const [ocrError, setOcrError] = useState(null)
  const [ocrProgress, setOcrProgress] = useState({
    status: 'idle',
    index: 0,
    total: 0,
    label: null,
    filename: null,
    progress: 0,
  })

  const validImages = useMemo(
    () => pendingImages.filter((img) => img.status === IMAGE_STATUS.VALID && img.file),
    [pendingImages]
  )

  // Demo mode: fake pipeline (unchanged behavior)
  useEffect(() => {
    if (!isDemo) return undefined
    const timer = setInterval(() => {
      setActive((step) => Math.min(step + 1, DEMO_STEPS.length))
    }, 900)
    return () => clearInterval(timer)
  }, [isDemo])

  useEffect(() => {
    if (!isDemo || active < DEMO_STEPS.length) return undefined
    const scanId = resolveDemoScan(demoKey).id
    const t = setTimeout(() => navigate(`/results/${scanId}`), 600)
    return () => clearTimeout(t)
  }, [active, demoKey, isDemo, navigate])

  // Upload path: real OCR.
  // Each effect instance owns a `cancelled` flag. StrictMode remount cleanup cancels the
  // in-flight run, then the remounted effect starts a fresh run (no sticky started latch).
  useEffect(() => {
    if (isDemo) return undefined
    if (!isUpload) {
      navigate('/scan', { replace: true })
      return undefined
    }
    if (!validImages.length) {
      navigate('/scan', { replace: true })
      return undefined
    }

    let cancelled = false

    ;(async () => {
      setOcrError(null)
      setOcrResults([])
      setOcrProgress({
        status: 'running',
        index: 0,
        total: validImages.length,
        label: validImages[0]?.label ?? null,
        filename: validImages[0]?.name ?? null,
        progress: 0,
      })

      try {
        const items = validImages.map((img) => ({
          id: img.id,
          file: img.file,
          filename: img.name,
          label: img.label,
        }))

        const results = await recognizeImages(items, {
          onProgress: (event) => {
            if (cancelled) return
            setOcrProgress({
              status: 'running',
              index: event.index ?? 0,
              total: event.total ?? validImages.length,
              label: event.label ?? null,
              filename: event.filename ?? null,
              progress: event.progress ?? 0,
            })
          },
        })

        if (cancelled) return
        setOcrResults(results)
        setOcrProgress((prev) => ({ ...prev, status: 'done', progress: 1 }))
        navigate('/ocr-results')
      } catch (err) {
        if (cancelled) return
        setOcrError(err?.message || 'OCR processing failed. Please try again.')
        setOcrProgress((prev) => ({ ...prev, status: 'error' }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isDemo, isUpload, navigate, setOcrResults, validImages])

  if (isDemo) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <p className="section-kicker">Pipeline</p>
        <h1 className="mt-1 font-display text-4xl text-navy-900">Processing screening case</h1>
        <p className="mt-2 text-sm text-ink-600">
          Running quality analysis, text extraction, declaration structuring, and rule validation.
        </p>

        <ol className="mt-10 space-y-3">
          {DEMO_STEPS.map((label, index) => {
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

  const currentIndex = ocrProgress.index ?? 0
  const total = ocrProgress.total || validImages.length || 1
  const overall =
    ocrProgress.status === 'done'
      ? 1
      : (currentIndex + (ocrProgress.progress || 0)) / total

  return (
    <div className="mx-auto max-w-2xl py-6">
      <p className="section-kicker">OCR</p>
      <h1 className="mt-1 font-display text-4xl text-navy-900">Extracting text from images</h1>
      <p className="mt-2 text-sm text-ink-600">
        Running client-side OCR (Tesseract.js) on each uploaded packaging image. No declaration extraction or rule
        checks yet.
      </p>

      {ocrError ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-status-critical">OCR failed</p>
          <p className="mt-1 text-sm text-ink-600">{ocrError}</p>
          <Link to="/scan" className="btn-primary mt-4 inline-flex">
            Back to scan
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-gold-500 bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 text-white">
                {ocrProgress.status === 'done' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">
                  {ocrProgress.status === 'done'
                    ? 'OCR complete'
                    : `Image ${Math.min(currentIndex + 1, total)} of ${total}`}
                </p>
                <p className="truncate text-xs text-ink-400">
                  {ocrProgress.label ? `${ocrProgress.label} · ` : ''}
                  {ocrProgress.filename || 'Preparing…'}
                  {ocrProgress.status === 'running' ? ` · ${formatPct(ocrProgress.progress)}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-200"
                style={{ width: `${Math.round(overall * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-400">Overall progress · {formatPct(overall)}</p>
          </div>

          <ol className="space-y-2">
            {validImages.map((img, index) => {
              const done = ocrProgress.status === 'done' || index < currentIndex
              const current = ocrProgress.status === 'running' && index === currentIndex
              return (
                <li
                  key={img.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    current ? 'border-gold-500 bg-white' : 'border-ink-100 bg-white/70'
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                      done ? 'bg-teal-700 text-white' : current ? 'bg-navy-800 text-white' : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : current ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">
                      {img.label} · {img.name}
                    </p>
                    <p className="text-xs text-ink-400">
                      {done ? 'Complete' : current ? `In progress · ${formatPct(ocrProgress.progress)}` : 'Queued'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
