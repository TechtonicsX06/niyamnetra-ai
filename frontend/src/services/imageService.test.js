import { describe, expect, it, vi } from 'vitest'
import { IMAGE_ERROR, IMAGE_ERROR_MESSAGE, IMAGE_STATUS, MAX_IMAGE_BYTES } from '../utils/constants.js'
import { sniffFileType, validateImageFile } from './imageService.js'

function fileFromBytes(name, type, bytes) {
  return new File([new Uint8Array(bytes)], name, { type })
}

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]
const WEBP_BYTES = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]
const DOC_BYTES = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

const okDecode = vi.fn(async () => ({ width: 640, height: 480 }))

describe('sniffFileType', () => {
  it('detects jpeg, png, webp, and pdf from magic bytes', () => {
    expect(sniffFileType(new Uint8Array(JPEG_BYTES)).mime).toBe('image/jpeg')
    expect(sniffFileType(new Uint8Array(PNG_BYTES)).mime).toBe('image/png')
    expect(sniffFileType(new Uint8Array(WEBP_BYTES)).mime).toBe('image/webp')
    expect(sniffFileType(new Uint8Array(PDF_BYTES))).toEqual({ mime: 'application/pdf', kind: 'document' })
  })
})

describe('validateImageFile', () => {
  it('accepts a readable jpeg as VALID', async () => {
    const file = fileFromBytes('front.jpg', 'image/jpeg', JPEG_BYTES)
    const result = await validateImageFile(file, { decodeImage: okDecode })
    expect(result.status).toBe(IMAGE_STATUS.VALID)
    expect(result.mime).toBe('image/jpeg')
    expect(result.width).toBe(640)
    expect(result.height).toBe(480)
    expect(result.error).toBeNull()
  })

  it('rejects pdf and office documents as unsupported type', async () => {
    const pdf = await validateImageFile(fileFromBytes('label.pdf', 'application/pdf', PDF_BYTES), {
      decodeImage: okDecode,
    })
    expect(pdf.status).toBe(IMAGE_STATUS.INVALID)
    expect(pdf.errorCode).toBe(IMAGE_ERROR.UNSUPPORTED_TYPE)
    expect(pdf.error).toBe(IMAGE_ERROR_MESSAGE.UNSUPPORTED_TYPE)

    const doc = await validateImageFile(fileFromBytes('notes.doc', 'application/msword', DOC_BYTES), {
      decodeImage: okDecode,
    })
    expect(doc.errorCode).toBe(IMAGE_ERROR.UNSUPPORTED_TYPE)
  })

  it('rejects files over 10 MB', async () => {
    expect(MAX_IMAGE_BYTES).toBe(10 * 1024 * 1024)
    const file = fileFromBytes('huge.jpg', 'image/jpeg', JPEG_BYTES)
    Object.defineProperty(file, 'size', { value: MAX_IMAGE_BYTES + 1 })
    const result = await validateImageFile(file, { decodeImage: okDecode })
    expect(result.errorCode).toBe(IMAGE_ERROR.OVERSIZED)
    expect(result.error).toBe(IMAGE_ERROR_MESSAGE.OVERSIZED)
    expect(okDecode).not.toHaveBeenCalled()
  })

  it('rejects corrupted images that fail to decode', async () => {
    const decodeImage = vi.fn(async () => {
      const error = new Error('decode')
      error.code = IMAGE_ERROR.CORRUPTED
      throw error
    })
    const result = await validateImageFile(fileFromBytes('broken.jpg', 'image/jpeg', JPEG_BYTES), { decodeImage })
    expect(result.status).toBe(IMAGE_STATUS.INVALID)
    expect(result.errorCode).toBe(IMAGE_ERROR.CORRUPTED)
    expect(result.error).toBe(IMAGE_ERROR_MESSAGE.CORRUPTED)
  })

  it('rejects unreadable empty files', async () => {
    const file = fileFromBytes('empty.png', 'image/png', [])
    const result = await validateImageFile(file, { decodeImage: okDecode })
    expect(result.errorCode).toBe(IMAGE_ERROR.UNREADABLE)
    expect(result.error).toBe(IMAGE_ERROR_MESSAGE.UNREADABLE)
  })
})
