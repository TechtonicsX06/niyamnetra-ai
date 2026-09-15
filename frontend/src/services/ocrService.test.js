import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OCR_ERROR_MESSAGE, OCR_STATUS } from '../utils/constants.js'
import { recognizeImage, recognizeImages } from './ocrService.js'

function mockWorker(recognizeImpl) {
  return {
    recognize: vi.fn(recognizeImpl),
    terminate: vi.fn(async () => {}),
  }
}

describe('recognizeImage', () => {
  it('returns SUCCESS with normalized confidence and preserved metadata', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'front.jpg', { type: 'image/jpeg' })
    const worker = mockWorker(async () => ({
      data: { text: '  MRP Rs 50\nNet Qty 200g  ', confidence: 88 },
    }))
    const createWorker = vi.fn(async () => worker)

    const result = await recognizeImage(
      { id: 'img-1', file, filename: 'front.jpg', label: 'Front' },
      { createWorker }
    )

    expect(result).toEqual({
      id: 'img-1',
      filename: 'front.jpg',
      label: 'Front',
      rawText: 'MRP Rs 50\nNet Qty 200g',
      confidence: 0.88,
      status: OCR_STATUS.SUCCESS,
      error: null,
    })
    expect(worker.recognize).toHaveBeenCalledWith(file)
    expect(worker.terminate).toHaveBeenCalled()
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
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('returns FAILED when recognize throws without crashing', async () => {
    const file = new File([new Uint8Array([1])], 'side.png', { type: 'image/png' })
    const worker = mockWorker(async () => {
      throw new Error('engine crashed')
    })
    const createWorker = vi.fn(async () => worker)

    const result = await recognizeImage(
      { id: 'img-3', file, name: 'side.png', label: 'Side' },
      { createWorker }
    )

    expect(result.status).toBe(OCR_STATUS.FAILED)
    expect(result.error).toBe('engine crashed')
    expect(result.filename).toBe('side.png')
    expect(worker.terminate).toHaveBeenCalled()
  })
})

describe('recognizeImages', () => {
  let progressEvents

  beforeEach(() => {
    progressEvents = []
  })

  it('processes multiple images and preserves labels', async () => {
    const files = [
      { id: 'a', file: new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' }), filename: 'a.jpg', label: 'Front' },
      { id: 'b', file: new File([new Uint8Array([2])], 'b.jpg', { type: 'image/jpeg' }), filename: 'b.jpg', label: 'Back' },
    ]

    const worker = mockWorker(async (file) => ({
      data: {
        text: file.name === 'a.jpg' ? 'FRONT TEXT' : 'BACK TEXT',
        confidence: file.name === 'a.jpg' ? 90 : 70,
      },
    }))
    const createWorker = vi.fn(async () => worker)

    const results = await recognizeImages(files, {
      createWorker,
      onProgress: (event) => progressEvents.push(event),
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      id: 'a',
      label: 'Front',
      filename: 'a.jpg',
      rawText: 'FRONT TEXT',
      confidence: 0.9,
      status: OCR_STATUS.SUCCESS,
    })
    expect(results[1]).toMatchObject({
      id: 'b',
      label: 'Back',
      filename: 'b.jpg',
      rawText: 'BACK TEXT',
      confidence: 0.7,
      status: OCR_STATUS.SUCCESS,
    })
    expect(worker.recognize).toHaveBeenCalledTimes(2)
    expect(worker.terminate).toHaveBeenCalledTimes(1)
    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents.some((e) => e.label === 'Front')).toBe(true)
    expect(progressEvents.some((e) => e.label === 'Back')).toBe(true)
  })

  it('continues the batch when one image fails', async () => {
    const items = [
      { id: 'ok', file: new File([new Uint8Array([1])], 'ok.jpg', { type: 'image/jpeg' }), filename: 'ok.jpg', label: 'Front' },
      { id: 'bad', filename: 'bad.jpg', label: 'Back' },
      { id: 'ok2', file: new File([new Uint8Array([3])], 'ok2.jpg', { type: 'image/jpeg' }), filename: 'ok2.jpg', label: 'Side' },
    ]

    const worker = mockWorker(async (file) => ({
      data: { text: `text-${file.name}`, confidence: 80 },
    }))
    const createWorker = vi.fn(async () => worker)

    const results = await recognizeImages(items, { createWorker })

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
        { id: '1', file: new File([new Uint8Array([1])], '1.jpg', { type: 'image/jpeg' }), filename: '1.jpg', label: 'Front' },
        { id: '2', file: new File([new Uint8Array([2])], '2.jpg', { type: 'image/jpeg' }), filename: '2.jpg', label: 'Other' },
      ],
      { createWorker }
    )

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.status === OCR_STATUS.FAILED)).toBe(true)
    expect(results[0].error).toBe('wasm load failed')
    expect(results[1].label).toBe('Other')
  })
})
