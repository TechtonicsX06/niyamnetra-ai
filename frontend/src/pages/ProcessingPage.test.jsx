import { StrictMode, useEffect, useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanProvider, useScanSession } from '../hooks/useScanSession.jsx'
import { IMAGE_STATUS, OCR_STATUS } from '../utils/constants.js'
import { recognizeImages } from '../services/ocrService.js'
import ProcessingPage from './ProcessingPage.jsx'

vi.mock('../services/ocrService.js', () => ({
  recognizeImages: vi.fn(),
}))

function SeedUploadImages({ images, children }) {
  const { setPendingImages, pendingImages } = useScanSession()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPendingImages(images)
    setReady(true)
  }, [images, setPendingImages])

  if (!ready || pendingImages.length === 0) return null
  return children
}

describe('ProcessingPage upload OCR (StrictMode)', () => {
  beforeEach(() => {
    vi.mocked(recognizeImages).mockReset()
    vi.mocked(recognizeImages).mockImplementation(async (items) =>
      items.map((item) => ({
        id: item.id,
        filename: item.filename,
        label: item.label,
        rawText: 'SAMPLE',
        confidence: 0.9,
        status: OCR_STATUS.SUCCESS,
        error: null,
      }))
    )
  })

  it('still completes OCR after StrictMode remount cleanup', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'front.jpg', { type: 'image/jpeg' })
    const images = [
      {
        id: 'img-1',
        file,
        name: 'front.jpg',
        size: file.size,
        label: 'Front',
        status: IMAGE_STATUS.VALID,
        previewUrl: null,
        quality: null,
        error: null,
      },
    ]

    render(
      <StrictMode>
        <ScanProvider>
          <MemoryRouter initialEntries={['/processing?source=upload']}>
            <SeedUploadImages images={images}>
              <Routes>
                <Route path="/processing" element={<ProcessingPage />} />
                <Route path="/ocr-results" element={<div>ocr-results-ready</div>} />
                <Route path="/scan" element={<div>scan-page</div>} />
              </Routes>
            </SeedUploadImages>
          </MemoryRouter>
        </ScanProvider>
      </StrictMode>
    )

    await waitFor(() => {
      expect(screen.getByText('ocr-results-ready')).toBeInTheDocument()
    })

    // StrictMode mounts effects twice: first run is cancelled, remount must start again.
    expect(recognizeImages.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
