import { useNavigate } from 'react-router-dom'
import ImageUploader from '../components/upload/ImageUploader.jsx'
import ImagePreviewCard from '../components/upload/ImagePreviewCard.jsx'
import UploadSummary from '../components/upload/UploadSummary.jsx'
import { useImageUpload } from '../hooks/useImageUpload.js'
import { useScanSession } from '../hooks/useScanSession.jsx'

export default function NewScanPage() {
  const navigate = useNavigate()
  const { clearSession } = useScanSession()
  const {
    images,
    addFiles,
    removeImage,
    replaceImage,
    setLabel,
    canContinueToOcr,
  } = useImageUpload()

  const continueToOcr = () => {
    if (!canContinueToOcr) return
    navigate('/processing?source=upload')
  }

  const runDemo = (key) => {
    clearSession()
    navigate(`/processing?demo=${key}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="section-kicker">Case intake</p>
        <h1 className="mt-1 font-display text-4xl text-navy-900">New screening scan</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Upload real packaging images. Files are validated for type, size, and readability before they can proceed to
          OCR. Supported formats: JPG, JPEG, PNG, and WEBP (max 10 MB each).
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-navy-900">Product images</h2>
        <ImageUploader onFiles={addFiles}>
          {images.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <ImagePreviewCard
                  key={image.id}
                  image={image}
                  onRemove={removeImage}
                  onReplace={replaceImage}
                  onLabelChange={setLabel}
                />
              ))}
            </div>
          )}
        </ImageUploader>
        <UploadSummary images={images} canContinueToOcr={canContinueToOcr} />
        <button type="button" className="btn-primary" onClick={continueToOcr} disabled={!canContinueToOcr}>
          Continue to OCR
        </button>
      </section>

      <section className="rounded-2xl border border-dashed border-navy-200 bg-navy-950/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">Demo mode</p>
        <p className="mt-1 text-sm text-ink-600">
          Presentation shortcuts. These do not use uploaded files and do not run OCR.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => runDemo('pass')}>
            Demo: checks passed
          </button>
          <button type="button" className="btn-secondary" onClick={() => runDemo('issue')}>
            Demo: potential issue
          </button>
          <button type="button" className="btn-secondary" onClick={() => runDemo('review')}>
            Demo: needs review
          </button>
        </div>
      </section>
    </div>
  )
}
