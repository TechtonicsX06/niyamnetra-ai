import { useMemo, useRef, useState } from 'react'
import { ImagePlus, UploadCloud } from 'lucide-react'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'

export default function ImageUploader({ onFiles, disabled = false, children }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const dropHandlers = useMemo(
    () => ({
      onDragOver: (event) => {
        event.preventDefault()
        if (!disabled) setDragOver(true)
      },
      onDragLeave: () => setDragOver(false),
      onDrop: (event) => {
        event.preventDefault()
        setDragOver(false)
        if (!disabled) onFiles(event.dataTransfer.files)
      },
    }),
    [disabled, onFiles]
  )

  return (
    <div className="space-y-4">
      <div
        {...dropHandlers}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? 'border-gold-500 bg-gold-400/10' : 'border-navy-200 bg-white/80'
        }`}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-navy-600" />
        <p className="mt-3 font-semibold text-navy-900">Drag and drop packaging images</p>
        <p className="mt-1 text-sm text-ink-500">JPG, JPEG, PNG, WEBP · max 10 MB each · multiple files</p>
        <button
          type="button"
          className="btn-primary mt-5"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" /> Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            onFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
      {children}
    </div>
  )
}
