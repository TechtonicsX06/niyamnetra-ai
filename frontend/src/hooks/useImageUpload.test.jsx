import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanProvider } from './useScanSession.jsx'
import { useImageUpload } from './useImageUpload.js'
import { IMAGE_ERROR, IMAGE_ERROR_MESSAGE, IMAGE_STATUS } from '../utils/constants.js'
import { estimateImageQuality, validateImageFile } from '../services/imageService.js'

vi.mock('../services/imageService.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    validateImageFile: vi.fn(),
    estimateImageQuality: vi.fn(),
  }
})

function fileFromBytes(name, type, bytes) {
  return new File([new Uint8Array(bytes)], name, { type })
}

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]
const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]

function wrapper({ children }) {
  return <ScanProvider>{children}</ScanProvider>
}

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.mocked(validateImageFile).mockImplementation(async (file) => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return {
          status: IMAGE_STATUS.INVALID,
          errorCode: IMAGE_ERROR.UNSUPPORTED_TYPE,
          error: IMAGE_ERROR_MESSAGE.UNSUPPORTED_TYPE,
          mime: null,
          width: null,
          height: null,
        }
      }
      return {
        status: IMAGE_STATUS.VALID,
        errorCode: null,
        error: null,
        mime: 'image/jpeg',
        width: 800,
        height: 600,
      }
    })
    vi.mocked(estimateImageQuality).mockResolvedValue({ warning: false, message: null })
  })

  it('accepts multiple valid images and keeps original File objects', async () => {
    const { result } = renderHook(() => useImageUpload(), { wrapper })
    const front = fileFromBytes('front.jpg', 'image/jpeg', JPEG_BYTES)
    const back = fileFromBytes('back.jpg', 'image/jpeg', JPEG_BYTES)

    act(() => {
      result.current.addFiles([front, back])
    })

    await waitFor(() => {
      expect(result.current.images).toHaveLength(2)
      expect(result.current.images.every((item) => item.status === IMAGE_STATUS.VALID)).toBe(true)
    })

    expect(result.current.images[0].file).toBe(front)
    expect(result.current.images[1].file).toBe(back)
    expect(result.current.images.map((item) => item.label)).toEqual(['Front', 'Back'])
    expect(result.current.canContinueToOcr).toBe(true)
    expect(result.current.readyFiles).toEqual([front, back])
  })

  it('marks invalid types and does not enable Continue to OCR', async () => {
    const { result } = renderHook(() => useImageUpload(), { wrapper })

    act(() => {
      result.current.addFiles([fileFromBytes('pack.pdf', 'application/pdf', PDF_BYTES)])
    })

    await waitFor(() => {
      expect(result.current.images[0]?.status).toBe(IMAGE_STATUS.INVALID)
    })

    expect(result.current.images[0].errorCode).toBe(IMAGE_ERROR.UNSUPPORTED_TYPE)
    expect(result.current.canContinueToOcr).toBe(false)
  })

  it('removes an image from the session', async () => {
    const { result } = renderHook(() => useImageUpload(), { wrapper })

    act(() => {
      result.current.addFiles([fileFromBytes('side.jpg', 'image/jpeg', JPEG_BYTES)])
    })

    await waitFor(() => expect(result.current.images).toHaveLength(1))
    const id = result.current.images[0].id

    act(() => {
      result.current.removeImage(id)
    })

    expect(result.current.images).toHaveLength(0)
    expect(result.current.canContinueToOcr).toBe(false)
  })
})
