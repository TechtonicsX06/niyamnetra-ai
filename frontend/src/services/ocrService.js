/**
 * Phase 3 client-side OCR via Tesseract.js.
 * Processes original File objects from the Phase 2 upload session.
 */
import { createWorker as defaultCreateWorker } from 'tesseract.js'
import { OCR_ERROR_MESSAGE, OCR_STATUS } from '../utils/constants.js'

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

function failedResult(item, errorMessage) {
  return baseResult(item, {
    rawText: '',
    confidence: 0,
    status: OCR_STATUS.FAILED,
    error: errorMessage || OCR_ERROR_MESSAGE.RECOGNITION_FAILED,
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
 * Run OCR on a single image descriptor.
 * @param {{ id: string, file: File, filename?: string, name?: string, label?: string }} item
 * @param {{ onProgress?: Function, createWorker?: Function, worker?: object }} [options]
 */
export async function recognizeImage(item, options = {}) {
  const meta = itemMeta(item)

  if (!item?.file) {
    return failedResult(meta, OCR_ERROR_MESSAGE.MISSING_FILE)
  }

  const createWorker = options.createWorker ?? defaultCreateWorker
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

    const { data } = await worker.recognize(item.file)
    const rawText = (data?.text ?? '').trim()
    const confidence = normalizeConfidence(data?.confidence)

    return baseResult(meta, {
      rawText,
      confidence,
      status: OCR_STATUS.SUCCESS,
      error: null,
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
 * @param {{ onProgress?: Function, createWorker?: Function }} [options]
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
          options.onProgress({
            ...active.meta,
            index: active.index,
            total: list.length,
            progress: typeof message.progress === 'number' ? message.progress : 0,
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
      active = { meta, index }

      if (typeof options.onProgress === 'function') {
        options.onProgress({
          ...meta,
          index,
          total: list.length,
          progress: 0,
        })
      }

      const result = await recognizeImage(item, { worker, createWorker })
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
