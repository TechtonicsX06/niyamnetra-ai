import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_MIMES,
  IMAGE_ERROR,
  IMAGE_ERROR_MESSAGE,
  IMAGE_STATUS,
  MAX_IMAGE_BYTES,
} from '../utils/constants.js'

const HEADER_BYTES = 16

export function isSupportedDeclaredType(file) {
  if (!file) return false
  if (file.type && ACCEPTED_IMAGE_MIMES.includes(file.type)) return true
  const name = file.name?.toLowerCase() || ''
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/** @deprecated Use validateImageFile — kept for Phase 1 call sites. */
export function isSupportedImage(file) {
  return isSupportedDeclaredType(file)
}

/**
 * Detect actual type from magic bytes (not the browser-declared MIME).
 */
export function sniffFileType(bytes) {
  if (!bytes || bytes.length < 4) {
    return { mime: null, kind: 'unknown' }
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', kind: 'image' }
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: 'image/png', kind: 'image' }
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', kind: 'image' }
  }

  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: 'application/pdf', kind: 'document' }
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: 'image/gif', kind: 'unsupported-image' }
  }

  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { mime: 'image/bmp', kind: 'unsupported-image' }
  }

  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return { mime: 'application/msword', kind: 'document' }
  }

  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return { mime: 'application/zip', kind: 'document' }
  }

  return { mime: null, kind: 'unknown' }
}

function fail(code) {
  return {
    status: IMAGE_STATUS.INVALID,
    errorCode: code,
    error: IMAGE_ERROR_MESSAGE[code],
    mime: null,
    width: null,
    height: null,
  }
}

export async function decodeImageFromFile(file) {
  const url = URL.createObjectURL(file)
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file)
        const width = bitmap.width
        const height = bitmap.height
        bitmap.close?.()
        if (!width || !height) {
          const error = new Error('UNREADABLE')
          error.code = IMAGE_ERROR.UNREADABLE
          throw error
        }
        return { width, height }
      } catch (err) {
        if (err?.code === IMAGE_ERROR.UNREADABLE) throw err
      }
    }

    return await loadImageDimensions(url)
  } catch (err) {
    if (err?.code) throw err
    const error = new Error('CORRUPTED')
    error.code = IMAGE_ERROR.CORRUPTED
    throw error
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (!width || !height) {
        const error = new Error('UNREADABLE')
        error.code = IMAGE_ERROR.UNREADABLE
        reject(error)
        return
      }
      resolve({ width, height })
    }
    img.onerror = () => {
      const error = new Error('CORRUPTED')
      error.code = IMAGE_ERROR.CORRUPTED
      reject(error)
    }
    img.src = src
  })
}

/**
 * Validate a real File for Phase 2 intake.
 * Does not run OCR. Preserves the original File on the caller side.
 */
export async function validateImageFile(file, options = {}) {
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES
  const decodeImage = options.decodeImage ?? decodeImageFromFile

  if (!file) return fail(IMAGE_ERROR.UNREADABLE)
  if (file.size > maxBytes) return fail(IMAGE_ERROR.OVERSIZED)
  if (file.size === 0) return fail(IMAGE_ERROR.UNREADABLE)

  let header
  try {
    header = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer())
  } catch {
    return fail(IMAGE_ERROR.UNREADABLE)
  }

  const sniffed = sniffFileType(header)

  if (sniffed.kind === 'document' || sniffed.kind === 'unsupported-image') {
    return fail(IMAGE_ERROR.UNSUPPORTED_TYPE)
  }

  if (file.type && !ACCEPTED_IMAGE_MIMES.includes(file.type) && sniffed.kind !== 'image') {
    return fail(IMAGE_ERROR.UNSUPPORTED_TYPE)
  }

  if (sniffed.kind === 'unknown') {
    return fail(IMAGE_ERROR.UNSUPPORTED_TYPE)
  }

  if (!ACCEPTED_IMAGE_MIMES.includes(sniffed.mime)) {
    return fail(IMAGE_ERROR.UNSUPPORTED_TYPE)
  }

  try {
    const decoded = await decodeImage(file)
    if (!decoded?.width || !decoded?.height) return fail(IMAGE_ERROR.UNREADABLE)
    return {
      status: IMAGE_STATUS.VALID,
      errorCode: null,
      error: null,
      mime: sniffed.mime,
      width: decoded.width,
      height: decoded.height,
    }
  } catch (err) {
    if (err?.code === IMAGE_ERROR.UNREADABLE) return fail(IMAGE_ERROR.UNREADABLE)
    return fail(IMAGE_ERROR.CORRUPTED)
  }
}

/**
 * Lightweight client-side quality heuristic (non-blocking).
 * Real blur / lighting analysis arrives in later phases.
 */
export async function estimateImageQuality(file, dimensions) {
  const size = file?.size ?? 0
  let width = dimensions?.width
  let height = dimensions?.height

  if (!width || !height) {
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      width = img.width
      height = img.height
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const minSide = Math.min(width, height)
  const resolution = minSide >= 900 ? 'high' : minSide >= 480 ? 'medium' : 'low'
  const lighting = size < 80_000 && minSide < 600 ? 'poor' : 'adequate'
  const blur = resolution === 'low' ? 0.7 : resolution === 'medium' ? 0.35 : 0.15
  const warning = resolution === 'low' || lighting === 'poor'
  return {
    width,
    height,
    resolution,
    lighting,
    orientation: width >= height ? 'landscape' : 'portrait',
    blur,
    warning,
    message: warning ? 'Image quality may affect text extraction.' : null,
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to read image.'))
    img.src = src
  })
}
