/**
 * Phase 3 client-side OCR via Tesseract.js.
 * Processes original File objects from the Phase 2 upload session.
 * Runs MVP preprocessing variants; never mutates the original File.
 */
import { createWorker as defaultCreateWorker, PSM } from 'tesseract.js'
import { OCR_ERROR_MESSAGE, OCR_STATUS } from '../utils/constants.js'
import { VARIANT_ID, buildOcrVariants } from './ocrPreprocessService.js'

/** Page segmentation choices for packaging labels. */
export const OCR_PSM = {
  /** Assume a single uniform block of text. */
  SINGLE_BLOCK: PSM.SINGLE_BLOCK, // '6'
  /** Find as much text as possible in no particular order. */
  SPARSE_TEXT: PSM.SPARSE_TEXT, // '11'
}

/**
 * Which PSM to try per preprocessing variant.
 * Thresholded sparse text often benefits from PSM 11;
 * enlarged / enhanced blocks from PSM 6 (plus enhanced also tries 11).
 */
export const VARIANT_PSM_PLAN = [
  { variantId: VARIANT_ID.ENLARGED, psm: OCR_PSM.SINGLE_BLOCK },
  { variantId: VARIANT_ID.ENHANCED, psm: OCR_PSM.SINGLE_BLOCK },
  { variantId: VARIANT_ID.ENHANCED, psm: OCR_PSM.SPARSE_TEXT },
  { variantId: VARIANT_ID.THRESHOLD, psm: OCR_PSM.SPARSE_TEXT },
]

function normalizeConfidence(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1 && value <= 100) return value / 100
  if (value > 100) return 1
  return value
}

function baseResult(item, overrides = {}) {
  return {
    id: item?.id ?? null,
    filename: item?.filename ?? item?.name ?? null,
    label: item?.label ?? null,
    rawText: '',
    confidence: 0,
    status: OCR_STATUS.FAILED,
    error: null,
    ...overrides,
  }
}

function failedResult(item, errorMessage, qualityOverrides = {}) {
  return baseResult(item, {
    rawText: '',
    confidence: 0,
    status: OCR_STATUS.FAILED,
    error: errorMessage || OCR_ERROR_MESSAGE.RECOGNITION_FAILED,
    ocrQuality: {
      originalDimensions: null,
      processedDimensions: null,
      preprocessingVariants: [],
      bestVariant: null,
      confidence: 0,
      uncertainty: true,
      uncertaintyReason: 'OCR failed for this image.',
      ...qualityOverrides,
    },
  })
}

function itemMeta(item) {
  return {
    id: item?.id ?? null,
    filename: item?.filename ?? item?.name ?? null,
    label: item?.label ?? null,
  }
}

/**
 * Deterministic score for picking the best OCR candidate.
 * Balances engine confidence with packaging-relevant text traits
 * (length, words, digits for quantities/measurements, alphanumeric density).
 */
export function scoreOcrCandidate({ text, rawText, confidence }) {
  const conf = normalizeConfidence(confidence)
  const cleaned = (typeof text === 'string' ? text : typeof rawText === 'string' ? rawText : '')
    .trim()
  if (!cleaned) return Number.NEGATIVE_INFINITY

  const len = cleaned.length
  const words = cleaned.split(/\s+/).filter(Boolean)
  const digitCount = (cleaned.match(/\d/g) || []).length
  const alphaCount = (cleaned.match(/[A-Za-z]/g) || []).length
  const alnum = digitCount + alphaCount
  const alnumRatio = len ? alnum / len : 0
  const avgWordLen = words.length ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0
  const weirdCharCount = (cleaned.match(/[^A-Za-z0-9\s.,;:%/()+\-]/g) || []).length
  const weirdRatio = len ? weirdCharCount / len : 0

  let score = conf * 100
  score += Math.min(len, 600) * 0.04
  score += Math.min(words.length, 50) * 0.55
  score += Math.min(digitCount, 30) * 0.9
  score += alnumRatio * 18

  if (avgWordLen < 1.8) score -= 12
  if (len < 8) score -= 18
  if (weirdRatio > 0.25) score -= 20
  if (words.length === 1 && len < 12) score -= 8

  return score
}

export function selectBestOcrCandidate(candidates) {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : []
  if (!list.length) return null

  let best = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const candidate of list) {
    const score = scoreOcrCandidate(candidate)
    if (score > bestScore) {
      bestScore = score
      best = { ...candidate, score }
    }
  }

  return best
}

function assessUncertainty(best, candidates) {
  if (!best || !best.rawText?.trim()) {
    return { uncertainty: true, uncertaintyReason: 'Little or no text was detected.' }
  }

  const conf = normalizeConfidence(best.confidence)
  if (conf < 0.55) {
    return {
      uncertainty: true,
      uncertaintyReason: 'OCR confidence is low — small, curved, or low-contrast text may be unreliable.',
    }
  }

  const successes = (candidates || []).filter((c) => c?.rawText?.trim())
  if (successes.length >= 2) {
    const normalized = successes.map((c) =>
      c.rawText
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120)
    )
    const unique = new Set(normalized)
    if (unique.size >= 2 && conf < 0.8) {
      return {
        uncertainty: true,
        uncertaintyReason: 'Preprocessing variants disagreed on the extracted text.',
      }
    }
  }

  const digitSparse = (best.rawText.match(/\d/g) || []).length === 0 && best.rawText.length > 40
  if (digitSparse && conf < 0.75) {
    return {
      uncertainty: true,
      uncertaintyReason: 'Quantities and measurements may be incomplete on difficult labels.',
    }
  }

  return { uncertainty: false, uncertaintyReason: null }
}

function imageQualityBand(originalDimensions) {
  const w = originalDimensions?.width || 0
  const h = originalDimensions?.height || 0
  const minSide = Math.min(w, h)
  if (!minSide) return 'unknown'
  if (minSide >= 1000) return 'good'
  if (minSide >= 600) return 'fair'
  return 'challenging'
}

async function runVariantRecognize(worker, source, psm) {
  if (typeof worker.setParameters === 'function') {
    await worker.setParameters({
      tessedit_pageseg_mode: psm,
      // Hint DPI after upscaling to reduce “invalid resolution” noise.
      user_defined_dpi: '300',
    })
  }
  const { data } = await worker.recognize(source)
  return {
    rawText: (data?.text ?? '').trim(),
    confidence: normalizeConfidence(data?.confidence),
  }
}

/**
 * Run OCR on a single image descriptor with multi-variant preprocessing.
 * @param {{ id: string, file: File, filename?: string, name?: string, label?: string }} item
 * @param {{
 *   onProgress?: Function,
 *   createWorker?: Function,
 *   worker?: object,
 *   buildVariants?: Function,
 * }} [options]
 */
export async function recognizeImage(item, options = {}) {
  const meta = itemMeta(item)

  if (!item?.file) {
    return failedResult(meta, OCR_ERROR_MESSAGE.MISSING_FILE)
  }

  const createWorker = options.createWorker ?? defaultCreateWorker
  const buildVariants = options.buildVariants ?? buildOcrVariants
  const ownsWorker = !options.worker
  let worker = options.worker

  try {
    if (!worker) {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (typeof options.onProgress === 'function' && message?.status === 'recognizing text') {
            options.onProgress({
              ...meta,
              progress: typeof message.progress === 'number' ? message.progress : 0,
            })
          }
        },
      })
    }

    let prepared = null
    try {
      prepared = await buildVariants(item.file)
    } catch {
      prepared = null
    }

    const candidates = []
    const variantIdsUsed = []

    if (prepared?.variants?.length) {
      const byId = new Map(prepared.variants.map((v) => [v.id, v]))
      const plan = VARIANT_PSM_PLAN.filter((step) => byId.has(step.variantId))
      const totalSteps = Math.max(plan.length, 1)

      for (let i = 0; i < plan.length; i += 1) {
        const step = plan[i]
        const variant = byId.get(step.variantId)
        if (!variantIdsUsed.includes(step.variantId)) {
          variantIdsUsed.push(step.variantId)
        }

        if (typeof options.onProgress === 'function') {
          options.onProgress({
            ...meta,
            progress: i / totalSteps,
            variant: step.variantId,
            psm: step.psm,
          })
        }

        try {
          const recognized = await runVariantRecognize(worker, variant.blob, step.psm)
          candidates.push({
            ...recognized,
            variantId: step.variantId,
            psm: step.psm,
            runKey: `${step.variantId}:psm${step.psm}`,
          })
        } catch {
          // One variant failure must not abort the image.
        }

        if (typeof options.onProgress === 'function') {
          options.onProgress({
            ...meta,
            progress: (i + 1) / totalSteps,
            variant: step.variantId,
            psm: step.psm,
          })
        }
      }
    }

    // Compatibility fallback: original file, PSM 6 — if preprocess failed or all variants failed.
    if (!candidates.length) {
      try {
        if (typeof options.onProgress === 'function') {
          options.onProgress({ ...meta, progress: 0.5, variant: 'original', psm: OCR_PSM.SINGLE_BLOCK })
        }
        const recognized = await runVariantRecognize(worker, item.file, OCR_PSM.SINGLE_BLOCK)
        candidates.push({
          ...recognized,
          variantId: 'original',
          psm: OCR_PSM.SINGLE_BLOCK,
          runKey: `original:psm${OCR_PSM.SINGLE_BLOCK}`,
        })
        if (!variantIdsUsed.includes('original')) variantIdsUsed.push('original')
      } catch (err) {
        const message =
          err?.message && typeof err.message === 'string'
            ? err.message
            : OCR_ERROR_MESSAGE.RECOGNITION_FAILED
        return failedResult(meta, message, {
          originalDimensions: prepared?.originalDimensions ?? null,
          processedDimensions: prepared?.processedDimensions ?? null,
          preprocessingVariants: variantIdsUsed,
        })
      }
    }

    const best = selectBestOcrCandidate(candidates)
    if (!best || !best.rawText) {
      const emptyBest = best || candidates[0] || { confidence: 0, variantId: null }
      const uncertainty = assessUncertainty(emptyBest, candidates)
      return baseResult(meta, {
        rawText: '',
        confidence: normalizeConfidence(emptyBest.confidence),
        status: OCR_STATUS.SUCCESS,
        error: null,
        ocrQuality: {
          originalDimensions: prepared?.originalDimensions ?? null,
          processedDimensions: prepared?.processedDimensions ?? null,
          preprocessingVariants: variantIdsUsed,
          bestVariant: emptyBest.variantId ?? null,
          bestPsm: emptyBest.psm ?? null,
          confidence: normalizeConfidence(emptyBest.confidence),
          imageQuality: imageQualityBand(prepared?.originalDimensions),
          upscaleFactor: prepared?.upscaleFactor ?? 1,
          ...uncertainty,
        },
      })
    }

    const uncertainty = assessUncertainty(best, candidates)
    const confidence = normalizeConfidence(best.confidence)

    return baseResult(meta, {
      rawText: best.rawText,
      confidence,
      status: OCR_STATUS.SUCCESS,
      error: null,
      ocrQuality: {
        originalDimensions: prepared?.originalDimensions ?? null,
        processedDimensions: prepared?.processedDimensions ?? null,
        preprocessingVariants: variantIdsUsed,
        bestVariant: best.variantId ?? null,
        bestPsm: best.psm ?? null,
        confidence,
        imageQuality: imageQualityBand(prepared?.originalDimensions),
        upscaleFactor: prepared?.upscaleFactor ?? 1,
        ...uncertainty,
      },
    })
  } catch (err) {
    const message =
      err?.message && typeof err.message === 'string'
        ? err.message
        : OCR_ERROR_MESSAGE.RECOGNITION_FAILED
    return failedResult(meta, message)
  } finally {
    if (ownsWorker && worker) {
      try {
        await worker.terminate()
      } catch {
        // ignore terminate errors
      }
    }
  }
}

/**
 * Run OCR on multiple images sequentially, reusing one worker.
 * Individual failures do not abort the batch.
 * @param {Array<{ id: string, file: File, filename?: string, name?: string, label?: string }>} items
 * @param {{ onProgress?: Function, createWorker?: Function, buildVariants?: Function }} [options]
 */
export async function recognizeImages(items, options = {}) {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return []

  const createWorker = options.createWorker ?? defaultCreateWorker
  let worker = null
  const results = []
  let active = null

  try {
    try {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (typeof options.onProgress !== 'function' || !active) return
          if (message?.status !== 'recognizing text') return
          // Map engine progress into the current image slot; fine-grained variant
          // progress is reported from recognizeImage via onProgress as well.
          const base = active.variantBase ?? 0
          const span = active.variantSpan ?? 1
          const local = typeof message.progress === 'number' ? message.progress : 0
          options.onProgress({
            ...active.meta,
            index: active.index,
            total: list.length,
            progress: Math.min(1, base + local * span),
          })
        },
      })
    } catch (err) {
      const message =
        err?.message && typeof err.message === 'string'
          ? err.message
          : OCR_ERROR_MESSAGE.WORKER_FAILED
      return list.map((item) => failedResult(itemMeta(item), message))
    }

    for (let index = 0; index < list.length; index += 1) {
      const item = list[index]
      const meta = itemMeta(item)
      active = { meta, index, variantBase: 0, variantSpan: 1 }

      if (typeof options.onProgress === 'function') {
        options.onProgress({
          ...meta,
          index,
          total: list.length,
          progress: 0,
        })
      }

      const result = await recognizeImage(item, {
        worker,
        createWorker,
        buildVariants: options.buildVariants,
        onProgress: (event) => {
          if (typeof options.onProgress !== 'function') return
          options.onProgress({
            ...meta,
            index,
            total: list.length,
            progress: typeof event.progress === 'number' ? event.progress : 0,
            variant: event.variant,
            psm: event.psm,
          })
        },
      })
      results.push(result)

      if (typeof options.onProgress === 'function') {
        options.onProgress({
          ...meta,
          index,
          total: list.length,
          progress: 1,
          done: true,
        })
      }
    }

    return results
  } finally {
    active = null
    if (worker) {
      try {
        await worker.terminate()
      } catch {
        // ignore terminate errors
      }
    }
  }
}
