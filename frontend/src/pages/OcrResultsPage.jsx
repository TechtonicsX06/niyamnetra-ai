import { Link } from 'react-router-dom'
import ConfidenceMeter from '../components/ui/ConfidenceMeter.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useScanSession } from '../hooks/useScanSession.jsx'
import { OCR_STATUS, confidenceLabel } from '../utils/constants.js'

export default function OcrResultsPage() {
  const { ocrResults, clearSession } = useScanSession()

  if (!ocrResults?.length) {
    return (
      <EmptyState
        title="No OCR results yet"
        action={
          <Link to="/scan" className="btn-primary">
            Back to new scan
          </Link>
        }
      >
        Upload packaging images and continue to OCR to see extracted text here.
      </EmptyState>
    )
  }

  const successCount = ocrResults.filter((r) => r.status === OCR_STATUS.SUCCESS).length
  const failedCount = ocrResults.length - successCount

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Phase 3</p>
          <h1 className="mt-1 font-display text-4xl text-navy-900">OCR results</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Raw text extracted from each uploaded image. Declaration extraction and compliance checks are not applied
            yet.
          </p>
          <p className="mt-2 text-xs text-ink-400">
            {successCount} succeeded
            {failedCount > 0 ? ` · ${failedCount} failed` : ''} · {ocrResults.length} image
            {ocrResults.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          to="/scan"
          className="btn-primary"
          onClick={() => {
            clearSession()
          }}
        >
          New scan
        </Link>
      </div>

      <div className="space-y-5">
        {ocrResults.map((result) => {
          const ok = result.status === OCR_STATUS.SUCCESS
          return (
            <article
              key={result.id || `${result.label}-${result.filename}`}
              className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">
                    {result.label || 'Unlabeled'}
                  </p>
                  <h2 className="mt-1 truncate font-display text-2xl text-navy-900" title={result.filename || ''}>
                    {result.filename || 'Untitled image'}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      ok
                        ? 'border-emerald-200 bg-emerald-50 text-status-pass'
                        : 'border-red-200 bg-red-50 text-status-critical'
                    }`}
                  >
                    {result.status}
                  </span>
                  {ok && (
                    <div className="w-40">
                      <ConfidenceMeter value={result.confidence || 0} compact />
                      <p className="sr-only">{confidenceLabel(result.confidence || 0)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                {result.error && <p className="text-sm text-status-critical">{result.error}</p>}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Raw OCR text</p>
                  {result.rawText ? (
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-ink-100 bg-ink-50/80 p-4 font-mono text-xs leading-relaxed text-navy-900">
                      {result.rawText}
                    </pre>
                  ) : (
                    <p className="mt-2 text-sm text-ink-400">
                      {ok ? 'No text was detected in this image.' : 'No text available.'}
                    </p>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
