import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OCR_ERROR_MESSAGE, OCR_STATUS } from '../utils/constants.js'
import { VARIANT_ID } from './ocrPreprocessService.js'
import {
  OCR_PSM,
  recognizeImage,
  recognizeImages,
  scoreOcrCandidate,
  selectBestOcrCandidate,
} from './ocrService.js'

function mockWorker(recognizeImpl) {
  return {
    recognize: vi.fn(recognizeImpl),
    setParameters: vi.fn(async () => {}),
    terminate: vi.fn(async () => {}),
  }
}

function mockPrepared(overrides = {}) {
  return {
    originalDimensions: { width: 720, height: 1280 },
    processedDimensions: { width: 2160, height: 3840 },
    upscaleFactor: 3,
    variants: [
      {
        id: VARIANT_ID.ENLARGED,
        blob: new Blob([new Uint8Array([1])], { type: 'image/png' }),
        width: 2160,
        height: 3840,
        steps: ['upscale_3x'],
      },
      {
        id: VARIANT_ID.ENHANCED,
        blob: new Blob([new Uint8Array([2])], { type: 'image/png' }),
        width: 2160,
        height: 3840,
        steps: ['upscale_3x', 'grayscale', 'contrast', 'sharpen'],
      },
      {
        id: VARIANT_ID.THRESHOLD,
        blob: new Blob([new Uint8Array([3])], { type: 'image/png' }),
        width: 2160,
        height: 3840,
        steps: ['upscale_3x', 'grayscale', 'otsu_threshold'],
      },
    ],
    ...overrides,
  }
}

describe('scoreOcrCandidate / selectBestOcrCandidate', () => {
  it('prefers higher confidence with useful packaging text', () => {
    const weak = scoreOcrCandidate({ text: 'ab', confidence: 0.95 })
    const strong = scoreOcrCandidate({
      text: 'MRP Rs 50\nNet Qty 200 g\nBest before 12/2026',
      confidence: 0.72,
    })
    expect(strong).toBeGreaterThan(weak)
  })

  it('selects the best candidate deterministically', () => {
    const best = selectBestOcrCandidate([
      { rawText: 'xx', confidence: 0.9, variantId: 'enlarged' },
      {
        rawText: 'Net Quantity 500 ml MRP 120',
        confidence: 0.7,
        variantId: 'enhanced',
        psm: '6',
      },
      { rawText: '', confidence: 0.99, variantId: 'threshold' },
    ])
    expect(best.variantId).toBe('enhanced')
    expect(best.rawText).toContain('Net Quantity')
  })
})

describe('recognizeImage', () => {
  it('returns SUCCESS with quality metadata and preserved fields', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'front.jpg', { type: 'image/jpeg' })
    const worker = mockWorker(async () => ({
      data: { text: '  MRP Rs 50\nNet Qty 200g  ', confidence: 88 },
    }))
    const createWorker = vi.fn(async () => worker)
    const buildVariants = vi.fn(async () => mockPrepared())

    const result = await recognizeImage(
      { id: 'img-1', file, filename: 'front.jpg', label: 'Front' },
      { createWorker, buildVariants }
    )

    expect(result).toMatchObject({
      id: 'img-1',
      filename: 'front.jpg',
      label: 'Front',
      rawText: 'MRP Rs 50\nNet Qty 200g',
      confidence: 0.88,
      status: OCR_STATUS.SUCCESS,
      error: null,
    })
    expect(result.ocrQuality).toMatchObject({
      originalDimensions: { width: 720, height: 1280 },
      processedDimensions: { width: 2160, height: 3840 },
      preprocessingVariants: expect.arrayContaining([
        VARIANT_ID.ENLARGED,
        VARIANT_ID.ENHANCED,
        VARIANT_ID.THRESHOLD,
      ]),
      bestVariant: expect.any(String),
      confidence: 0.88,
    })
    expect(worker.setParameters).toHaveBeenCalled()
    expect(worker.recognize.mock.calls.length).toBeGreaterThanOrEqual(3)
    expect(worker.terminate).toHaveBeenCalled()
    expect(file.size).toBe(3)
  })

  it('picks the strongest variant when results differ', async () => {
    const file = new File([new Uint8Array([1])], 'label.jpg', { type: 'image/jpeg' })
    let call = 0
    const worker = mockWorker(async () => {
      call += 1
      if (call === 1) return { data: { text: '@@@', confidence: 40 } }
      if (call === 2) {
        return { data: { text: 'Net Qty 200g MRP Rs.99', confidence: 70 } }
      }
      if (call === 3) return { data: { text: 'Net Qty 200g MRP Rs.99 Extra', confidence: 60 } }
      return { data: { text: 'noise', confidence: 30 } }
    })

    const result = await recognizeImage(
      { id: 'img-best', file, filename: 'label.jpg', label: 'Back' },
      {
        createWorker: async () => worker,
        buildVariants: async () => mockPrepared(),
      }
    )

    expect(result.status).toBe(OCR_STATUS.SUCCESS)
    expect(result.rawText).toContain('Net Qty')
    expect(result.ocrQuality.bestVariant).toBeTruthy()
    expect([VARIANT_ID.ENHANCED, VARIANT_ID.ENLARGED, VARIANT_ID.THRESHOLD]).toContain(
      result.ocrQuality.bestVariant
    )
  })

  it('continues when one OCR variant throws', async () => {
    const file = new File([new Uint8Array([1])], 'side.png', { type: 'image/png' })
    let call = 0
    const worker = mockWorker(async () => {
      call += 1
      if (call === 1) throw new Error('variant boom')
      return { data: { text: 'Ingredients Water Sugar 10g', confidence: 75 } }
    })

    const result = await recognizeImage(
      { id: 'img-3', file, name: 'side.png', label: 'Side' },
      {
        createWorker: async () => worker,
        buildVariants: async () => mockPrepared(),
      }
    )

    expect(result.status).toBe(OCR_STATUS.SUCCESS)
    expect(result.rawText).toContain('Ingredients')
    expect(result.filename).toBe('side.png')
  })

  it('falls back to the original file when preprocessing fails', async () => {
    const file = new File([new Uint8Array([9])], 'fallback.jpg', { type: 'image/jpeg' })
    const worker = mockWorker(async (source) => {
      expect(source).toBe(file)
      return { data: { text: 'FALLBACK TEXT 12g', confidence: 80 } }
    })

    const result = await recognizeImage(
      { id: 'fb', file, filename: 'fallback.jpg', label: 'Other' },
      {
        createWorker: async () => worker,
        buildVariants: async () => {
          throw new Error('canvas unavailable')
        },
      }
    )

    expect(result.status).toBe(OCR_STATUS.SUCCESS)
    expect(result.rawText).toBe('FALLBACK TEXT 12g')
    expect(result.ocrQuality.bestVariant).toBe('original')
    expect(worker.setParameters).toHaveBeenCalledWith(
      expect.objectContaining({ tessedit_pageseg_mode: OCR_PSM.SINGLE_BLOCK })
    )
  })

  it('returns FAILED when file is missing', async () => {
    const createWorker = vi.fn()
    const result = await recognizeImage(
      { id: 'img-2', filename: 'missing.jpg', label: 'Back' },
      { createWorker }
    )

    expect(result.status).toBe(OCR_STATUS.FAILED)
    expect(result.error).toBe(OCR_ERROR_MESSAGE.MISSING_FILE)
    expect(result.rawText).toBe('')
    expect(result.confidence).toBe(0)
    expect(result.label).toBe('Back')
    expect(result.ocrQuality).toBeTruthy()
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('returns FAILED when all recognition attempts throw', async () => {
    const file = new File([new Uint8Array([1])], 'bad.png', { type: 'image/png' })
    const worker = mockWorker(async () => {
      throw new Error('engine crashed')
    })

    const result = await recognizeImage(
      { id: 'img-crash', file, filename: 'bad.png', label: 'Side' },
      {
        createWorker: async () => worker,
        buildVariants: async () => mockPrepared(),
      }
    )

    expect(result.status).toBe(OCR_STATUS.FAILED)
    expect(result.error).toBe('engine crashed')
    expect(worker.terminate).toHaveBeenCalled()
  })

  it('uses PSM 6 and PSM 11 across the variant plan', async () => {
    const file = new File([new Uint8Array([1])], 'psm.jpg', { type: 'image/jpeg' })
    const worker = mockWorker(async () => ({
      data: { text: 'Label text 100 ml', confidence: 70 },
    }))

    await recognizeImage(
      { id: 'psm', file, filename: 'psm.jpg', label: 'Front' },
      {
        createWorker: async () => worker,
        buildVariants: async () => mockPrepared(),
      }
    )

    const psms = worker.setParameters.mock.calls.map((c) => c[0].tessedit_pageseg_mode)
    expect(psms).toContain(OCR_PSM.SINGLE_BLOCK)
    expect(psms).toContain(OCR_PSM.SPARSE_TEXT)
  })
})

describe('recognizeImages', () => {
  let progressEvents

  beforeEach(() => {
    progressEvents = []
  })

  it('processes multiple images and preserves labels', async () => {
    const files = [
      {
        id: 'a',
        file: new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' }),
        filename: 'a.jpg',
        label: 'Front',
      },
      {
        id: 'b',
        file: new File([new Uint8Array([2])], 'b.jpg', { type: 'image/jpeg' }),
        filename: 'b.jpg',
        label: 'Back',
      },
    ]

    const worker = mockWorker(async () => ({
      data: { text: 'SHARED TEXT 10g', confidence: 80 },
    }))
    const createWorker = vi.fn(async () => worker)
    const buildVariants = vi.fn(async () => mockPrepared())

    const results = await recognizeImages(files, {
      createWorker,
      buildVariants,
      onProgress: (event) => progressEvents.push(event),
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      id: 'a',
      label: 'Front',
      filename: 'a.jpg',
      status: OCR_STATUS.SUCCESS,
    })
    expect(results[1]).toMatchObject({
      id: 'b',
      label: 'Back',
      filename: 'b.jpg',
      status: OCR_STATUS.SUCCESS,
    })
    expect(worker.terminate).toHaveBeenCalledTimes(1)
    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents.some((e) => e.label === 'Front')).toBe(true)
    expect(progressEvents.some((e) => e.label === 'Back')).toBe(true)
  })

  it('continues the batch when one image fails', async () => {
    const items = [
      {
        id: 'ok',
        file: new File([new Uint8Array([1])], 'ok.jpg', { type: 'image/jpeg' }),
        filename: 'ok.jpg',
        label: 'Front',
      },
      { id: 'bad', filename: 'bad.jpg', label: 'Back' },
      {
        id: 'ok2',
        file: new File([new Uint8Array([3])], 'ok2.jpg', { type: 'image/jpeg' }),
        filename: 'ok2.jpg',
        label: 'Side',
      },
    ]

    const worker = mockWorker(async () => ({
      data: { text: 'text ok 5g', confidence: 80 },
    }))

    const results = await recognizeImages(items, {
      createWorker: async () => worker,
      buildVariants: async () => mockPrepared(),
    })

    expect(results).toHaveLength(3)
    expect(results[0].status).toBe(OCR_STATUS.SUCCESS)
    expect(results[1].status).toBe(OCR_STATUS.FAILED)
    expect(results[1].error).toBe(OCR_ERROR_MESSAGE.MISSING_FILE)
    expect(results[1].label).toBe('Back')
    expect(results[2].status).toBe(OCR_STATUS.SUCCESS)
    expect(results[2].label).toBe('Side')
  })

  it('marks all items FAILED when the worker fails to start', async () => {
    const createWorker = vi.fn(async () => {
      throw new Error('wasm load failed')
    })

    const results = await recognizeImages(
      [
        {
          id: '1',
          file: new File([new Uint8Array([1])], '1.jpg', { type: 'image/jpeg' }),
          filename: '1.jpg',
          label: 'Front',
        },
        {
          id: '2',
          file: new File([new Uint8Array([2])], '2.jpg', { type: 'image/jpeg' }),
          filename: '2.jpg',
          label: 'Other',
        },
      ],
      { createWorker }
    )

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.status === OCR_STATUS.FAILED)).toBe(true)
    expect(results[0].error).toBe('wasm load failed')
    expect(results[1].label).toBe('Other')
  })
})
