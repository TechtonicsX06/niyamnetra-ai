import { IMAGE_STATUS } from '../../utils/constants.js'

export default function UploadSummary({ images, canContinueToOcr }) {
  const valid = images.filter((item) => item.status === IMAGE_STATUS.VALID).length
  const invalid = images.filter((item) => item.status === IMAGE_STATUS.INVALID).length
  const processing = images.filter((item) => item.status === IMAGE_STATUS.PROCESSING).length

  if (!images.length) {
    return (
      <p className="text-sm text-ink-500">
        No images yet. Add at least one valid packaging photo to continue to OCR.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-600 shadow-card">
      <p className="font-semibold text-navy-900">Upload summary</p>
      <p className="mt-1">
        {images.length} file{images.length === 1 ? '' : 's'} · {valid} valid · {invalid} invalid
        {processing ? ` · ${processing} processing` : ''}
      </p>
      <p className="mt-1 text-xs text-ink-400">
        {canContinueToOcr
          ? 'Ready for OCR. Original files are kept in this session for Phase 3.'
          : 'Continue to OCR unlocks when at least one image is valid and none are still processing.'}
      </p>
    </div>
  )
}
