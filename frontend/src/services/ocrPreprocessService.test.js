import { describe, expect, it, vi } from 'vitest'
import {
  VARIANT_ID,
  applyContrast,
  applyGrayscale,
  applyOtsuThreshold,
  applySharpen,
  buildOcrVariants,
  chooseUpscaleFactor,
  cloneImageData,
} from './ocrPreprocessService.js'

function makeGrayImageData(width, height, fill = 128) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill
    data[i + 1] = fill
    data[i + 2] = fill
    data[i + 3] = 255
  }
  return { data, width, height }
}

describe('chooseUpscaleFactor', () => {
  it('uses 3x for small product-label sizes', () => {
    expect(chooseUpscaleFactor(720, 1280)).toBe(3)
  })

  it('uses 2x for medium sizes', () => {
    expect(chooseUpscaleFactor(900, 1200)).toBe(2)
  })

  it('skips upscaling for already-large images', () => {
    expect(chooseUpscaleFactor(1600, 2400)).toBe(1)
  })

  it('preserves aspect by capping against max edge', () => {
    // 720×1280 at 3× would exceed 2000 on the long edge → step down.
    expect(chooseUpscaleFactor(720, 1280, { maxEdge: 2000 })).toBe(1)
  })
})

describe('pixel preprocessing', () => {
  it('converts to grayscale using luma weights', () => {
    const image = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray([255, 0, 0, 255]),
    }
    applyGrayscale(image)
    expect(image.data[0]).toBe(image.data[1])
    expect(image.data[1]).toBe(image.data[2])
    expect(image.data[0]).toBe(76)
  })

  it('enhances contrast around mid-gray', () => {
    const image = makeGrayImageData(1, 1, 100)
    applyContrast(image, 2)
    expect(image.data[0]).toBeLessThan(100)
  })

  it('applies light sharpen without changing dimensions', () => {
    const image = makeGrayImageData(5, 5, 120)
    image.data[2 * 5 * 4 + 2 * 4] = 200
    image.data[2 * 5 * 4 + 2 * 4 + 1] = 200
    image.data[2 * 5 * 4 + 2 * 4 + 2] = 200
    const before = image.data[2 * 5 * 4 + 2 * 4]
    applySharpen(image)
    expect(image.width).toBe(5)
    expect(image.height).toBe(5)
    expect(image.data[2 * 5 * 4 + 2 * 4]).not.toBe(before)
  })

  it('binarizes with Otsu without mutating dimensions', () => {
    const image = makeGrayImageData(4, 1, 40)
    for (let x = 2; x < 4; x += 1) {
      const i = x * 4
      image.data[i] = 200
      image.data[i + 1] = 200
      image.data[i + 2] = 200
    }
    const { threshold } = applyOtsuThreshold(image)
    expect(threshold).toBeGreaterThan(0)
    expect(new Set([image.data[0], image.data[8]]).size).toBeGreaterThan(0)
    expect([0, 255]).toContain(image.data[0])
    expect([0, 255]).toContain(image.data[8])
  })

  it('cloneImageData deep-copies pixel buffer', () => {
    const original = makeGrayImageData(2, 2, 10)
    const copy = cloneImageData(original)
    copy.data[0] = 99
    expect(original.data[0]).toBe(10)
    expect(copy.data[0]).toBe(99)
  })
})

describe('variant ids', () => {
  it('exposes enlarged, enhanced, and threshold ids', () => {
    expect(VARIANT_ID.ENLARGED).toBe('enlarged')
    expect(VARIANT_ID.ENHANCED).toBe('enhanced')
    expect(VARIANT_ID.THRESHOLD).toBe('threshold')
  })
})

describe('buildOcrVariants', () => {
  it('never mutates the original File and returns three derived variants', async () => {
    const bytes = new Uint8Array([10, 20, 30])
    const file = new File([bytes], 'bottle.jpg', { type: 'image/jpeg' })
    const originalSize = file.size

    const width = 720
    const height = 1280
    const pixelCount = width * height * 4
    // Use a transferable buffer pattern via plain array that canvas mock fills.
    const basePixels = new Uint8ClampedArray(pixelCount)
    for (let i = 0; i < pixelCount; i += 4) {
      basePixels[i] = 80
      basePixels[i + 1] = 120
      basePixels[i + 2] = 160
      basePixels[i + 3] = 255
    }

    const loadBitmap = vi.fn(async () => ({
      width,
      height,
      close: vi.fn(),
    }))

    const createCanvas = vi.fn((w, h) => {
      const state = { w, h, pixels: new Uint8ClampedArray(w * h * 4) }
      state.pixels.set(basePixels.subarray(0, state.pixels.length))
      return {
        width: w,
        height: h,
        getContext: () => ({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'high',
          drawImage: vi.fn(),
          getImageData: () => ({
            data: new Uint8ClampedArray(state.pixels),
            width: state.w,
            height: state.h,
          }),
          putImageData: (imageData) => {
            state.pixels = new Uint8ClampedArray(imageData.data)
          },
          createImageData: (cw, ch) => ({
            data: new Uint8ClampedArray(cw * ch * 4),
            width: cw,
            height: ch,
          }),
        }),
        toBlob: (cb) => cb(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })),
      }
    })

    const result = await buildOcrVariants(file, { loadBitmap, createCanvas })

    expect(file.size).toBe(originalSize)
    expect(result.originalDimensions).toEqual({ width: 720, height: 1280 })
    expect(result.upscaleFactor).toBe(3)
    expect(result.processedDimensions).toEqual({ width: 2160, height: 3840 })
    expect(result.variants).toHaveLength(3)
    expect(result.variants.map((v) => v.id)).toEqual([
      VARIANT_ID.ENLARGED,
      VARIANT_ID.ENHANCED,
      VARIANT_ID.THRESHOLD,
    ])
    expect(result.variants.every((v) => v.blob instanceof Blob)).toBe(true)
    expect(result.variants[1].steps).toEqual(
      expect.arrayContaining(['grayscale', 'contrast', 'sharpen'])
    )
    expect(result.variants[2].steps.some((s) => s.startsWith('otsu_threshold'))).toBe(true)
  })
})
