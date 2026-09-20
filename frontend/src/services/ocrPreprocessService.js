/**
 * Phase 3 OCR preprocessing — browser-safe Canvas pipeline.
 * Never mutates the original uploaded File; returns derived Blobs only.
 */

export const VARIANT_ID = {
  ENLARGED: 'enlarged',
  ENHANCED: 'enhanced',
  THRESHOLD: 'threshold',
}

/** Soft cap so upscaling does not exhaust browser memory on large photos. */
export const MAX_PROCESSED_EDGE = 4000

/**
 * Choose 1x / 2x / 3x upscaling for small product-label photos.
 * Preserves aspect ratio; caller applies the factor uniformly.
 */
export function chooseUpscaleFactor(width, height, options = {}) {
  const maxEdge = options.maxEdge ?? MAX_PROCESSED_EDGE
  const w = Number(width) || 0
  const h = Number(height) || 0
  if (w <= 0 || h <= 0) return 1

  const minSide = Math.min(w, h)
  let factor = 1
  // Prefer 3× for phone-resolution product shots (~720px short side).
  if (minSide < 800) factor = 3
  else if (minSide < 1200) factor = 2

  while (factor > 1 && Math.max(w, h) * factor > maxEdge) {
    factor -= 1
  }
  return Math.max(1, factor)
}

export function cloneImageData(imageData) {
  const data = new Uint8ClampedArray(imageData.data)
  return { data, width: imageData.width, height: imageData.height }
}

/** Luma grayscale in-place on ImageData-like { data, width, height }. */
export function applyGrayscale(imageData) {
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
  return imageData
}

/**
 * Linear contrast around mid-gray. factor > 1 increases contrast.
 * Default ~1.35 is moderate — not aggressive clipping.
 */
export function applyContrast(imageData, factor = 1.35) {
  const { data } = imageData
  const f = Number(factor) || 1
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clampByte(((data[i] - 128) * f) + 128)
    data[i + 1] = clampByte(((data[i + 1] - 128) * f) + 128)
    data[i + 2] = clampByte(((data[i + 2] - 128) * f) + 128)
  }
  return imageData
}

/** Light 3×3 sharpen (center weight 5). Assumes grayscale or similar channels. */
export function applySharpen(imageData) {
  const { data, width, height } = imageData
  const src = new Uint8ClampedArray(data)
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0
      let ki = 0
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          sum += src[idx] * kernel[ki]
          ki += 1
        }
      }
      const out = clampByte(sum)
      const di = (y * width + x) * 4
      data[di] = out
      data[di + 1] = out
      data[di + 2] = out
    }
  }
  return imageData
}

/**
 * Otsu threshold → binary black/white.
 * Intended as one OCR variant, not the sole preprocessing path.
 */
export function applyOtsuThreshold(imageData) {
  const { data, width, height } = imageData
  const hist = new Array(256).fill(0)
  const total = width * height

  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]] += 1
  }

  let sum = 0
  for (let t = 0; t < 256; t += 1) sum += t * hist[t]

  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 128

  for (let t = 0; t < 256; t += 1) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > maxVar) {
      maxVar = between
      threshold = t
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] > threshold ? 255 : 0
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }

  return { imageData, threshold }
}

function clampByte(n) {
  if (n < 0) return 0
  if (n > 255) return 255
  return Math.round(n)
}

async function defaultLoadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to HTMLImageElement
    }
  }
  return loadHtmlImage(file)
}

function loadHtmlImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to decode image for OCR preprocessing.'))
    }
    img.src = url
  })
}

function defaultCreateCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function drawScaled(source, width, height, createCanvas) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D context unavailable.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  return { canvas, ctx }
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error('Failed to export processed image.'))
          else resolve(blob)
        },
        type,
        quality
      )
      return
    }
    try {
      const dataUrl = canvas.toDataURL(type, quality)
      const blob = dataUrlToBlob(dataUrl)
      resolve(blob)
    } catch (err) {
      reject(err)
    }
  })
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function closeBitmap(source) {
  if (source && typeof source.close === 'function') {
    try {
      source.close()
    } catch {
      // ignore
    }
  }
}

function putPixels(ctx, pixels) {
  if (typeof ImageData !== 'undefined') {
    ctx.putImageData(new ImageData(pixels.data, pixels.width, pixels.height), 0, 0)
    return
  }
  const imageData = ctx.createImageData(pixels.width, pixels.height)
  imageData.data.set(pixels.data)
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Build OCR-ready derived images from an original File.
 * Original file is never modified.
 *
 * @returns {Promise<{
 *   originalDimensions: { width: number, height: number },
 *   processedDimensions: { width: number, height: number },
 *   upscaleFactor: number,
 *   variants: Array<{ id: string, blob: Blob, width: number, height: number, steps: string[] }>
 * }>}
 */
export async function buildOcrVariants(file, options = {}) {
  if (!file) throw new Error('No file provided for OCR preprocessing.')

  const loadBitmap = options.loadBitmap ?? defaultLoadBitmap
  const createCanvas = options.createCanvas ?? defaultCreateCanvas
  const toBlob = options.canvasToBlob ?? canvasToBlob

  const source = await loadBitmap(file)
  try {
    const originalWidth = source.width || source.naturalWidth || 0
    const originalHeight = source.height || source.naturalHeight || 0
    if (!originalWidth || !originalHeight) {
      throw new Error('Image has no readable dimensions.')
    }

    const upscaleFactor = chooseUpscaleFactor(originalWidth, originalHeight, options)
    const processedWidth = Math.round(originalWidth * upscaleFactor)
    const processedHeight = Math.round(originalHeight * upscaleFactor)

    const { canvas, ctx } = drawScaled(source, processedWidth, processedHeight, createCanvas)
    const baseImageData = ctx.getImageData(0, 0, processedWidth, processedHeight)

    const variants = []

    // 1) Enlarged / normalized color (aspect preserved). Prefer PNG for OCR fidelity.
    {
      const blob = await toBlob(canvas, 'image/png')
      variants.push({
        id: VARIANT_ID.ENLARGED,
        blob,
        width: processedWidth,
        height: processedHeight,
        steps: upscaleFactor > 1 ? [`upscale_${upscaleFactor}x`] : ['identity_scale'],
      })
    }

    // 2) Enhanced grayscale (contrast + light sharpen) — primary non-binary path.
    {
      const enhanced = cloneImageData(baseImageData)
      applyGrayscale(enhanced)
      applyContrast(enhanced, 1.35)
      applySharpen(enhanced)
      putPixels(ctx, enhanced)
      const blob = await toBlob(canvas, 'image/png')
      variants.push({
        id: VARIANT_ID.ENHANCED,
        blob,
        width: processedWidth,
        height: processedHeight,
        steps: [
          ...(upscaleFactor > 1 ? [`upscale_${upscaleFactor}x`] : []),
          'grayscale',
          'contrast',
          'sharpen',
        ],
      })
    }

    // 3) Threshold / binarized — separate variant only (never the sole path).
    {
      const binary = cloneImageData(baseImageData)
      applyGrayscale(binary)
      applyContrast(binary, 1.2)
      const { threshold } = applyOtsuThreshold(binary)
      putPixels(ctx, binary)
      const blob = await toBlob(canvas, 'image/png')
      variants.push({
        id: VARIANT_ID.THRESHOLD,
        blob,
        width: processedWidth,
        height: processedHeight,
        steps: [
          ...(upscaleFactor > 1 ? [`upscale_${upscaleFactor}x`] : []),
          'grayscale',
          'contrast_light',
          `otsu_threshold_${threshold}`,
        ],
      })
    }

    return {
      originalDimensions: { width: originalWidth, height: originalHeight },
      processedDimensions: { width: processedWidth, height: processedHeight },
      upscaleFactor,
      variants,
    }
  } finally {
    closeBitmap(source)
  }
}
