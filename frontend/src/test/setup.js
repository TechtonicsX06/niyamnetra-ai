import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn()
}

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)

      reader.readAsArrayBuffer(this)
    })
  }
}