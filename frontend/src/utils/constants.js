/** Shared screening statuses — never use "illegal" or "legally compliant". */
export const SCREENING_STATUS = {
  PASS: {
    key: 'PASS',
    label: 'Preliminary Checks Passed',
    tone: 'pass',
    color: 'status-pass',
  },
  ISSUE: {
    key: 'ISSUE',
    label: 'Potential Issue Detected',
    tone: 'warn',
    color: 'status-warn',
  },
  REVIEW: {
    key: 'REVIEW',
    label: 'Needs Manual Review',
    tone: 'review',
    color: 'status-review',
  },
  CRITICAL: {
    key: 'CRITICAL',
    label: 'Critical Information Missing',
    tone: 'critical',
    color: 'status-critical',
  },
}

export const DISCLAIMER =
  'This result is generated through automated preliminary screening and should be reviewed by authorized personnel before making any legal or enforcement decision.'

export const CONFIDENCE_BANDS = {
  high: { min: 0.85, label: 'High Confidence' },
  medium: { min: 0.6, label: 'Medium Confidence' },
  low: { min: 0, label: 'Low Confidence' },
}

export function confidenceLabel(value) {
  if (value >= 0.85) return 'High Confidence'
  if (value >= 0.6) return 'Medium Confidence'
  return 'Low Confidence'
}

export function confidenceTone(value) {
  if (value >= 0.85) return 'pass'
  if (value >= 0.6) return 'warn'
  return 'critical'
}

/** Phase 2 image intake */
export const IMAGE_STATUS = {
  PROCESSING: 'PROCESSING',
  VALID: 'VALID',
  INVALID: 'INVALID',
}

export const IMAGE_LABELS = ['Front', 'Back', 'Side', 'Other']

export const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const IMAGE_ERROR = {
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  OVERSIZED: 'OVERSIZED',
  CORRUPTED: 'CORRUPTED',
  UNREADABLE: 'UNREADABLE',
}

export const IMAGE_ERROR_MESSAGE = {
  UNSUPPORTED_TYPE: 'Unsupported file type. Use JPG, JPEG, PNG, or WEBP.',
  OVERSIZED: 'This file is larger than 10 MB.',
  CORRUPTED: 'This image is corrupted or invalid.',
  UNREADABLE: 'This image could not be read.',
}

/** Phase 3 OCR */
export const OCR_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
}

export const OCR_ERROR_MESSAGE = {
  MISSING_FILE: 'No image file available for OCR.',
  RECOGNITION_FAILED: 'OCR could not extract text from this image.',
  WORKER_FAILED: 'OCR engine failed to start.',
}
