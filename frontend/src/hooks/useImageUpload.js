import { useCallback, useEffect, useMemo, useRef } from 'react'
import { IMAGE_LABELS, IMAGE_STATUS } from '../utils/constants.js'
import { estimateImageQuality, validateImageFile } from '../services/imageService.js'
import { useScanSession } from './useScanSession.jsx'

function nextLabel(items) {
  const used = new Set(items.map((item) => item.label))
  return IMAGE_LABELS.find((label) => !used.has(label)) || 'Other'
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createDraft(file, label) {
  return {
    id: makeId(),
    file,
    name: file.name,
    size: file.size,
    label,
    previewUrl: null,
    width: null,
    height: null,
    mime: null,
    status: IMAGE_STATUS.PROCESSING,
    error: null,
    errorCode: null,
    quality: null,
  }
}

function revokeIfNeeded(url) {
  if (url) URL.revokeObjectURL(url)
}

// Preview URL lifetime is owned by ScanProvider (revoke on replace/remove/clear).

export function useImageUpload() {
  const { pendingImages, setPendingImages } = useScanSession()
  const itemsRef = useRef(pendingImages)
  const tokensRef = useRef(new Map())

  useEffect(() => {
    itemsRef.current = pendingImages
  }, [pendingImages])

  const patchItem = useCallback(
    (id, updater) => {
      setPendingImages((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item
          return typeof updater === 'function' ? updater(item) : { ...item, ...updater }
        })
        itemsRef.current = next
        return next
      })
    },
    [setPendingImages]
  )

  const validateItem = useCallback(
    async (id, file) => {
      const token = (tokensRef.current.get(id) || 0) + 1
      tokensRef.current.set(id, token)

      const result = await validateImageFile(file)
      if (tokensRef.current.get(id) !== token) return
      if (!itemsRef.current.some((item) => item.id === id)) return

      if (result.status !== IMAGE_STATUS.VALID) {
        patchItem(id, {
          status: IMAGE_STATUS.INVALID,
          error: result.error,
          errorCode: result.errorCode,
          width: null,
          height: null,
          mime: result.mime,
          previewUrl: null,
          quality: null,
          file,
          name: file.name,
          size: file.size,
        })
        return
      }

      const previewUrl = URL.createObjectURL(file)
      const quality = await estimateImageQuality(file, { width: result.width, height: result.height }).catch(() => null)
      if (tokensRef.current.get(id) !== token) {
        revokeIfNeeded(previewUrl)
        return
      }

      patchItem(id, {
        status: IMAGE_STATUS.VALID,
        error: null,
        errorCode: null,
        width: result.width,
        height: result.height,
        mime: result.mime,
        previewUrl,
        quality,
        file,
        name: file.name,
        size: file.size,
      })
    },
    [patchItem]
  )

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []).filter(Boolean)
      if (!files.length) return

      setPendingImages((prev) => {
        const next = [...prev]
        files.forEach((file) => {
          const draft = createDraft(file, nextLabel(next))
          next.push(draft)
          queueMicrotask(() => validateItem(draft.id, draft.file))
        })
        itemsRef.current = next
        return next
      })
    },
    [setPendingImages, validateItem]
  )

  const removeImage = useCallback(
    (id) => {
      tokensRef.current.delete(id)
      setPendingImages((prev) => {
        const next = prev.filter((item) => item.id !== id)
        itemsRef.current = next
        return next
      })
    },
    [setPendingImages]
  )

  const replaceImage = useCallback(
    (id, file) => {
      if (!file) return
      tokensRef.current.set(id, (tokensRef.current.get(id) || 0) + 1)
      patchItem(id, (item) => ({
        ...item,
        file,
        name: file.name,
        size: file.size,
        previewUrl: null,
        width: null,
        height: null,
        mime: null,
        status: IMAGE_STATUS.PROCESSING,
        error: null,
        errorCode: null,
        quality: null,
      }))
      queueMicrotask(() => validateItem(id, file))
    },
    [patchItem, validateItem]
  )

  const setLabel = useCallback(
    (id, label) => {
      patchItem(id, { label })
    },
    [patchItem]
  )

  const validCount = pendingImages.filter((item) => item.status === IMAGE_STATUS.VALID).length
  const invalidCount = pendingImages.filter((item) => item.status === IMAGE_STATUS.INVALID).length
  const processingCount = pendingImages.filter((item) => item.status === IMAGE_STATUS.PROCESSING).length
  const canContinueToOcr = validCount >= 1 && processingCount === 0

  const readyFiles = useMemo(
    () => pendingImages.filter((item) => item.status === IMAGE_STATUS.VALID).map((item) => item.file),
    [pendingImages]
  )

  return {
    images: pendingImages,
    addFiles,
    removeImage,
    replaceImage,
    setLabel,
    validCount,
    invalidCount,
    processingCount,
    canContinueToOcr,
    readyFiles,
  }
}
