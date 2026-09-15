import { useRef } from 'react'
import { Loader2, Replace, Trash2 } from 'lucide-react'
import { IMAGE_LABELS, IMAGE_STATUS } from '../../utils/constants.js'
import { formatBytes } from '../../utils/format.js'

const STATUS_STYLES = {
  [IMAGE_STATUS.VALID]: 'border-emerald-200 bg-emerald-50 text-status-pass',
  [IMAGE_STATUS.INVALID]: 'border-red-200 bg-red-50 text-status-critical',
  [IMAGE_STATUS.PROCESSING]: 'border-navy-200 bg-navy-50 text-navy-700',
}

export default function ImagePreviewCard({ image, onRemove, onReplace, onLabelChange }) {
  const replaceRef = useRef(null)
  const dimensions =
    image.width && image.height ? `${image.width} × ${image.height}px` : 'Dimensions unavailable'

  return (
    <article className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
      <div className="relative h-40 bg-ink-100">
        {image.previewUrl ? (
          <img src={image.previewUrl} alt={image.name} className="h-40 w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-xs text-ink-400">
            {image.status === IMAGE_STATUS.PROCESSING ? 'Inspecting file…' : 'No preview'}
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-900" title={image.name}>
              {image.name}
            </p>
            <p className="text-xs text-ink-400">
              {formatBytes(image.size)}
              {image.status === IMAGE_STATUS.VALID ? ` · ${dimensions}` : ''}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              STATUS_STYLES[image.status]
            }`}
          >
            {image.status === IMAGE_STATUS.PROCESSING && (
              <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            )}
            {image.status}
          </span>
        </div>

        <label className="block text-xs font-medium text-ink-500">
          Image label
          <select
            className="mt-1 w-full rounded-md border border-ink-100 bg-white px-2 py-1.5 text-sm text-navy-900"
            value={image.label}
            onChange={(event) => onLabelChange(image.id, event.target.value)}
          >
            {IMAGE_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {image.error && <p className="text-xs text-status-critical">{image.error}</p>}
        {image.quality?.warning && image.status === IMAGE_STATUS.VALID && (
          <p className="text-xs text-status-warn">{image.quality.message}</p>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 !px-3 !py-1.5 text-xs" onClick={() => replaceRef.current?.click()}>
            <Replace className="h-3.5 w-3.5" /> Replace
          </button>
          <button
            type="button"
            className="btn-secondary flex-1 !px-3 !py-1.5 text-xs hover:!text-red-700"
            onClick={() => onRemove(image.id)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
          <input
            ref={replaceRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onReplace(image.id, file)
              event.target.value = ''
            }}
          />
        </div>
      </div>
    </article>
  )
}
