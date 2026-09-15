import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ScanContext = createContext(null)

function revokePreview(item) {
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
}

export function ScanProvider({ children }) {
  const [pendingImages, setPendingImagesState] = useState([])
  const [ocrResults, setOcrResults] = useState([])
  const [notes, setNotes] = useState('')

  const setPendingImages = useCallback((next) => {
    setPendingImagesState((prev) => {
      const nextList = typeof next === 'function' ? next(prev) : next
      const nextById = new Map(nextList.map((item) => [item.id, item]))
      prev.forEach((item) => {
        const updated = nextById.get(item.id)
        if (!updated || updated.previewUrl !== item.previewUrl) {
          revokePreview(item)
        }
      })
      return nextList
    })
  }, [])

  const clearSession = useCallback(() => {
    setPendingImagesState((prev) => {
      prev.forEach(revokePreview)
      return []
    })
    setOcrResults([])
    setNotes('')
  }, [])

  const value = useMemo(
    () => ({
      pendingImages,
      setPendingImages,
      ocrResults,
      setOcrResults,
      notes,
      setNotes,
      clearSession,
    }),
    [pendingImages, setPendingImages, ocrResults, notes, clearSession]
  )

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>
}

export function useScanSession() {
  const ctx = useContext(ScanContext)
  if (!ctx) {
    throw new Error('useScanSession must be used within ScanProvider')
  }
  return ctx
}
