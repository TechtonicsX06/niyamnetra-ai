/**
 * Phase 1 mock screening service.
 * Later phases will replace this with backend OCR / extraction / rules APIs.
 */
import { demoScanIds, getScanByDemoKey, getScanById, mockScans } from '../data/mockScans.js'

export function listScans() {
  return Object.values(mockScans)
}

export function fetchScan(scanId) {
  return getScanById(scanId)
}

export function resolveDemoScan(demoKey) {
  return getScanByDemoKey(demoKey)
}

export function pickDemoFromImageCount(count, qualityWarning) {
  if (qualityWarning) return demoScanIds.review
  if (count <= 1) return demoScanIds.critical
  if (count === 2) return demoScanIds.issue
  return demoScanIds.pass
}
