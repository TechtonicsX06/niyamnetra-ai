import { DISCLAIMER, SCREENING_STATUS } from '../utils/constants.js'

const now = new Date()

function daysAgo(n) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const mockRules = [
  {
    id: 'RULE_001',
    name: 'Net Quantity Declaration',
    category: 'general',
    field: 'net_quantity',
    condition: 'required',
    severity: 'high',
    description: 'Net quantity declaration should be present and readable.',
    reference: 'Legal Metrology (Packaged Commodities) Rules — quantity declaration',
    recommendation: 'Confirm unit and numeric quantity on the principal display panel.',
  },
  {
    id: 'RULE_002',
    name: 'MRP Declaration',
    category: 'general',
    field: 'mrp',
    condition: 'required',
    severity: 'high',
    description: 'Maximum retail price should be declared on the package.',
    reference: 'Packaged Commodities Rules — price declaration',
    recommendation: 'Verify MRP, inclusive-of-tax wording, and currency.',
  },
  {
    id: 'RULE_003',
    name: 'Manufacturer / Packer Identity',
    category: 'general',
    field: 'manufacturer',
    condition: 'required',
    severity: 'high',
    description: 'Manufacturer, packer, or importer name should be identifiable.',
    reference: 'Packaged Commodities Rules — name of manufacturer/packer/importer',
    recommendation: 'Check all faces of the package for manufacturer or packer details.',
  },
  {
    id: 'RULE_004',
    name: 'Manufacturer / Packer Address',
    category: 'general',
    field: 'address',
    condition: 'required',
    severity: 'high',
    description: 'Address of manufacturer, packer, or importer should be present.',
    reference: 'Packaged Commodities Rules — address declaration',
    recommendation: 'Capture a higher-resolution image of the address block if missing.',
  },
  {
    id: 'RULE_005',
    name: 'Date of Manufacture / Packing',
    category: 'general',
    field: 'mfg_date',
    condition: 'required',
    severity: 'medium',
    description: 'Manufacturing or packing date should be declared.',
    reference: 'Packaged Commodities Rules — month and year of manufacture/packing',
    recommendation: 'Look for MFG, PKD, or packed-on markings.',
  },
  {
    id: 'RULE_006',
    name: 'Consumer Care Details',
    category: 'general',
    field: 'customer_care',
    condition: 'required',
    severity: 'medium',
    description: 'Consumer care contact details should be available on the package.',
    reference: 'Packaged Commodities Rules — consumer care details',
    recommendation: 'Search for phone, email, or consumer care wording.',
  },
  {
    id: 'RULE_007',
    name: 'Country of Origin',
    category: 'imported',
    field: 'country_of_origin',
    condition: 'recommended',
    severity: 'medium',
    description: 'Country of origin should be declared where applicable.',
    reference: 'Packaged Commodities Rules — country of origin',
    recommendation: 'Confirm origin marking for imported commodities.',
  },
]

const field = (value, confidence, evidence, source) => ({
  value,
  confidence,
  evidence,
  source,
})

export const mockScans = {
  'NN-2026-10482': {
    id: 'NN-2026-10482',
    createdAt: daysAgo(0),
    productName: 'Annapurna Wheat Flour',
    brand: 'Annapurna Harvest',
    category: 'Food — Atta',
    demoKey: 'pass',
    quality: { blur: 0.12, resolution: 'high', lighting: 'adequate', orientation: 'upright', warning: false },
    overall: SCREENING_STATUS.PASS,
    score: 92,
    images: [
      { id: 'img-front', label: 'Front', role: 'Front image' },
      { id: 'img-back', label: 'Back', role: 'Back image' },
      { id: 'img-side', label: 'Side', role: 'Side image' },
    ],
    extractedText:
      'ANNAPURNA HARVEST\nWhole Wheat Atta\nNet Qty: 5 kg\nMRP ₹248.00 (Incl. of all taxes)\nMfd by: Annapurna Foods Pvt Ltd\nPlot 12, Industrial Area, Indore, MP 452015\nMfg: 08/2026  Best Before: 6 months from mfg\nConsumer Care: 1800-120-4455 | care@annapurnaharvest.in\nFSSAI Lic. No. 10012011000455\nBatch: AH-ATTA-0826-B14\nCountry of Origin: India',
    ocrConfidence: 0.94,
    declarations: {
      product_name: field('Whole Wheat Atta', 0.96, 'Whole Wheat Atta', 'Front image'),
      brand: field('Annapurna Harvest', 0.97, 'ANNAPURNA HARVEST', 'Front image'),
      category: field('Food — Atta', 0.9, 'Whole Wheat Atta', 'Front image'),
      manufacturer: field('Annapurna Foods Pvt Ltd', 0.93, 'Mfd by: Annapurna Foods Pvt Ltd', 'Back image'),
      packer: field(null, 0.2, null, null),
      importer: field(null, 0.1, null, null),
      address: field('Plot 12, Industrial Area, Indore, MP 452015', 0.91, 'Plot 12, Industrial Area, Indore, MP 452015', 'Back image'),
      net_quantity: field('5 kg', 0.98, 'Net Qty: 5 kg', 'Front image'),
      unit: field('kg', 0.98, 'Net Qty: 5 kg', 'Front image'),
      mrp: field('₹248.00', 0.95, 'MRP ₹248.00 (Incl. of all taxes)', 'Front image'),
      currency: field('INR', 0.95, 'MRP ₹248.00', 'Front image'),
      mfg_date: field('08/2026', 0.9, 'Mfg: 08/2026', 'Back image'),
      packing_date: field(null, 0.35, null, null),
      customer_care: field('1800-120-4455 / care@annapurnaharvest.in', 0.88, 'Consumer Care: 1800-120-4455', 'Back image'),
      phone: field('1800-120-4455', 0.92, '1800-120-4455', 'Back image'),
      email: field('care@annapurnaharvest.in', 0.9, 'care@annapurnaharvest.in', 'Back image'),
      country_of_origin: field('India', 0.94, 'Country of Origin: India', 'Back image'),
      batch: field('AH-ATTA-0826-B14', 0.86, 'Batch: AH-ATTA-0826-B14', 'Side image'),
      license: field('10012011000455', 0.84, 'FSSAI Lic. No. 10012011000455', 'Back image'),
    },
    ruleResults: [
      { rule_id: 'RULE_001', rule_name: 'Net Quantity Declaration', status: 'PASS', evidence: 'Net Qty: 5 kg', confidence: 0.98, source: 'Front image' },
      { rule_id: 'RULE_002', rule_name: 'MRP Declaration', status: 'PASS', evidence: 'MRP ₹248.00 (Incl. of all taxes)', confidence: 0.95, source: 'Front image' },
      { rule_id: 'RULE_003', rule_name: 'Manufacturer / Packer Identity', status: 'PASS', evidence: 'Mfd by: Annapurna Foods Pvt Ltd', confidence: 0.93, source: 'Back image' },
      { rule_id: 'RULE_004', rule_name: 'Manufacturer / Packer Address', status: 'PASS', evidence: 'Plot 12, Industrial Area, Indore, MP 452015', confidence: 0.91, source: 'Back image' },
      { rule_id: 'RULE_005', rule_name: 'Date of Manufacture / Packing', status: 'PASS', evidence: 'Mfg: 08/2026', confidence: 0.9, source: 'Back image' },
      { rule_id: 'RULE_006', rule_name: 'Consumer Care Details', status: 'PASS', evidence: 'Consumer Care: 1800-120-4455', confidence: 0.88, source: 'Back image' },
      { rule_id: 'RULE_007', rule_name: 'Country of Origin', status: 'PASS', evidence: 'Country of Origin: India', confidence: 0.94, source: 'Back image' },
    ],
    issues: [],
    explanation:
      'Mandatory packaged commodity declarations were detected with high confidence across front, back, and side images. Net quantity, MRP, manufacturer identity and address, manufacturing date, and consumer care details are present. This is a preliminary screening outcome only.',
    recommendations: [
      'No automated gaps were flagged for the declarations in the current rule set.',
      'Authorized personnel should still verify physical packaging before any enforcement action.',
    ],
    review: { status: 'pending', notes: '', confirmed: false },
    disclaimer: DISCLAIMER,
  },
  'NN-2026-10461': {
    id: 'NN-2026-10461',
    createdAt: daysAgo(1),
    productName: 'BluePeak Mineral Water',
    brand: 'BluePeak',
    category: 'Beverages — Packaged Water',
    demoKey: 'issue',
    quality: { blur: 0.18, resolution: 'medium', lighting: 'adequate', orientation: 'upright', warning: false },
    overall: SCREENING_STATUS.ISSUE,
    score: 71,
    images: [
      { id: 'img-front', label: 'Front', role: 'Front image' },
      { id: 'img-back', label: 'Back', role: 'Back image' },
    ],
    extractedText:
      'BLUEPEAK\nNatural Mineral Water\nNet Qty 1 L\nMRP Rs. 20\nPacked by BluePeak Beverages\nBatch BP-W-0912\nCustomer Care: 1800-222-0099',
    ocrConfidence: 0.81,
    declarations: {
      product_name: field('Natural Mineral Water', 0.93, 'Natural Mineral Water', 'Front image'),
      brand: field('BluePeak', 0.96, 'BLUEPEAK', 'Front image'),
      category: field('Beverages — Packaged Water', 0.86, 'Natural Mineral Water', 'Front image'),
      manufacturer: field('BluePeak Beverages', 0.78, 'Packed by BluePeak Beverages', 'Back image'),
      packer: field('BluePeak Beverages', 0.8, 'Packed by BluePeak Beverages', 'Back image'),
      importer: field(null, 0.1, null, null),
      address: field(null, 0.22, null, null),
      net_quantity: field('1 L', 0.94, 'Net Qty 1 L', 'Front image'),
      unit: field('L', 0.94, 'Net Qty 1 L', 'Front image'),
      mrp: field('₹20', 0.9, 'MRP Rs. 20', 'Front image'),
      currency: field('INR', 0.9, 'MRP Rs. 20', 'Front image'),
      mfg_date: field(null, 0.28, null, null),
      packing_date: field(null, 0.28, null, null),
      customer_care: field('1800-222-0099', 0.87, 'Customer Care: 1800-222-0099', 'Back image'),
      phone: field('1800-222-0099', 0.87, '1800-222-0099', 'Back image'),
      email: field(null, 0.15, null, null),
      country_of_origin: field(null, 0.2, null, null),
      batch: field('BP-W-0912', 0.83, 'Batch BP-W-0912', 'Back image'),
      license: field(null, 0.18, null, null),
    },
    ruleResults: [
      { rule_id: 'RULE_001', rule_name: 'Net Quantity Declaration', status: 'PASS', evidence: 'Net Qty 1 L', confidence: 0.94, source: 'Front image' },
      { rule_id: 'RULE_002', rule_name: 'MRP Declaration', status: 'PASS', evidence: 'MRP Rs. 20', confidence: 0.9, source: 'Front image' },
      { rule_id: 'RULE_003', rule_name: 'Manufacturer / Packer Identity', status: 'PASS', evidence: 'Packed by BluePeak Beverages', confidence: 0.78, source: 'Back image' },
      { rule_id: 'RULE_004', rule_name: 'Manufacturer / Packer Address', status: 'FAIL', evidence: 'No address block detected in OCR text', confidence: 0.22, source: 'Back image' },
      { rule_id: 'RULE_005', rule_name: 'Date of Manufacture / Packing', status: 'FAIL', evidence: 'No MFG / PKD date pattern detected', confidence: 0.28, source: 'Back image' },
      { rule_id: 'RULE_006', rule_name: 'Consumer Care Details', status: 'PASS', evidence: 'Customer Care: 1800-222-0099', confidence: 0.87, source: 'Back image' },
      { rule_id: 'RULE_007', rule_name: 'Country of Origin', status: 'WARNING', evidence: 'Origin statement not identified', confidence: 0.2, source: 'Back image' },
    ],
    issues: [
      { severity: 'high', title: 'Packer address not detected', detail: 'Manufacturer / packer address could not be extracted from the uploaded images.' },
      { severity: 'high', title: 'Manufacture / packing date missing', detail: 'No month-year manufacturing or packing date was identified.' },
    ],
    explanation:
      'Net quantity, MRP, packer name, and consumer care details were detected. However, the required manufacturer/packer address and manufacturing or packing date could not be confidently identified. Manual review of additional package faces is recommended.',
    recommendations: [
      'Upload a clearer image of the address and date code area.',
      'Confirm whether the date is laser-printed and poorly captured.',
      'Do not treat this screening as a legal determination.',
    ],
    review: { status: 'pending', notes: '', confirmed: false },
    disclaimer: DISCLAIMER,
  },
  'NN-2026-10440': {
    id: 'NN-2026-10440',
    createdAt: daysAgo(2),
    productName: 'Unlabelled snack pack (low quality capture)',
    brand: 'Unknown',
    category: 'Food — Snacks',
    demoKey: 'review',
    quality: { blur: 0.72, resolution: 'low', lighting: 'poor', orientation: 'tilted', warning: true },
    overall: SCREENING_STATUS.REVIEW,
    score: 44,
    images: [{ id: 'img-front', label: 'Front', role: 'Front image' }],
    extractedText:
      'SN..K MIX\nN t  1 0 g\nM R P  ??\nMfd ...\ncare 98??',
    ocrConfidence: 0.41,
    declarations: {
      product_name: field('SN..K MIX', 0.48, 'SN..K MIX', 'Front image'),
      brand: field(null, 0.21, null, null),
      category: field('Food — Snacks', 0.4, 'SN..K MIX', 'Front image'),
      manufacturer: field(null, 0.18, null, null),
      packer: field(null, 0.1, null, null),
      importer: field(null, 0.1, null, null),
      address: field(null, 0.12, null, null),
      net_quantity: field('10 g (uncertain)', 0.46, 'N t  1 0 g', 'Front image'),
      unit: field('g', 0.46, 'N t  1 0 g', 'Front image'),
      mrp: field(null, 0.25, 'M R P  ??', 'Front image'),
      currency: field('INR', 0.3, null, null),
      mfg_date: field(null, 0.2, 'Mfd ...', 'Front image'),
      packing_date: field(null, 0.1, null, null),
      customer_care: field(null, 0.22, 'care 98??', 'Front image'),
      phone: field(null, 0.2, null, null),
      email: field(null, 0.05, null, null),
      country_of_origin: field(null, 0.1, null, null),
      batch: field(null, 0.1, null, null),
      license: field(null, 0.08, null, null),
    },
    ruleResults: [
      { rule_id: 'RULE_001', rule_name: 'Net Quantity Declaration', status: 'REVIEW', evidence: 'Partial text: N t  1 0 g', confidence: 0.46, source: 'Front image' },
      { rule_id: 'RULE_002', rule_name: 'MRP Declaration', status: 'REVIEW', evidence: 'Unreadable MRP fragment', confidence: 0.25, source: 'Front image' },
      { rule_id: 'RULE_003', rule_name: 'Manufacturer / Packer Identity', status: 'FAIL', evidence: 'Not extracted — image quality too low', confidence: 0.18, source: 'Front image' },
      { rule_id: 'RULE_004', rule_name: 'Manufacturer / Packer Address', status: 'FAIL', evidence: 'Not extracted — image quality too low', confidence: 0.12, source: 'Front image' },
      { rule_id: 'RULE_005', rule_name: 'Date of Manufacture / Packing', status: 'REVIEW', evidence: 'Fragment: Mfd ...', confidence: 0.2, source: 'Front image' },
      { rule_id: 'RULE_006', rule_name: 'Consumer Care Details', status: 'REVIEW', evidence: 'Fragment: care 98??', confidence: 0.22, source: 'Front image' },
    ],
    issues: [
      { severity: 'critical', title: 'Image quality may affect text extraction', detail: 'High blur, low resolution, and poor lighting were detected. OCR confidence is below the review threshold.' },
      { severity: 'high', title: 'Multiple declarations unreadable', detail: 'Brand, manufacturer, address, and MRP could not be confirmed.' },
    ],
    explanation:
      'The uploaded image is blurred and poorly lit. Extracted text is fragmented, so several required declarations cannot be confirmed. Automated screening is inconclusive and human review with a better capture is required.',
    recommendations: [
      'Re-capture the package in even lighting, parallel to the camera.',
      'Upload front, back, and side panels separately.',
      'Treat all extracted values as unverified until visually confirmed.',
    ],
    review: { status: 'pending', notes: '', confirmed: false },
    disclaimer: DISCLAIMER,
  },
  'NN-2026-10398': {
    id: 'NN-2026-10398',
    createdAt: daysAgo(4),
    productName: 'Kiran Mustard Oil',
    brand: 'Kiran',
    category: 'Edible Oil',
    demoKey: 'critical',
    quality: { blur: 0.2, resolution: 'medium', lighting: 'adequate', orientation: 'upright', warning: false },
    overall: SCREENING_STATUS.CRITICAL,
    score: 38,
    images: [
      { id: 'img-front', label: 'Front', role: 'Front image' },
    ],
    extractedText: 'KIRAN\nMustard Oil\nKachi Ghani',
    ocrConfidence: 0.77,
    declarations: {
      product_name: field('Mustard Oil', 0.9, 'Mustard Oil', 'Front image'),
      brand: field('Kiran', 0.92, 'KIRAN', 'Front image'),
      category: field('Edible Oil', 0.8, 'Mustard Oil', 'Front image'),
      manufacturer: field(null, 0.14, null, null),
      packer: field(null, 0.1, null, null),
      importer: field(null, 0.1, null, null),
      address: field(null, 0.1, null, null),
      net_quantity: field(null, 0.16, null, null),
      unit: field(null, 0.1, null, null),
      mrp: field(null, 0.12, null, null),
      currency: field(null, 0.1, null, null),
      mfg_date: field(null, 0.1, null, null),
      packing_date: field(null, 0.1, null, null),
      customer_care: field(null, 0.1, null, null),
      phone: field(null, 0.1, null, null),
      email: field(null, 0.05, null, null),
      country_of_origin: field(null, 0.1, null, null),
      batch: field(null, 0.1, null, null),
      license: field(null, 0.08, null, null),
    },
    ruleResults: [
      { rule_id: 'RULE_001', rule_name: 'Net Quantity Declaration', status: 'FAIL', evidence: 'Not detected on uploaded face', confidence: 0.16, source: 'Front image' },
      { rule_id: 'RULE_002', rule_name: 'MRP Declaration', status: 'FAIL', evidence: 'Not detected on uploaded face', confidence: 0.12, source: 'Front image' },
      { rule_id: 'RULE_003', rule_name: 'Manufacturer / Packer Identity', status: 'FAIL', evidence: 'Not detected on uploaded face', confidence: 0.14, source: 'Front image' },
      { rule_id: 'RULE_004', rule_name: 'Manufacturer / Packer Address', status: 'FAIL', evidence: 'Not detected on uploaded face', confidence: 0.1, source: 'Front image' },
    ],
    issues: [
      { severity: 'critical', title: 'Core declarations missing from capture', detail: 'Only brand and product type were readable. Additional package faces are required.' },
    ],
    explanation:
      'Only the brand and product name were extracted from a single front image. Net quantity, MRP, manufacturer identity, and address were not detected. Additional images are required before screening can be considered complete.',
    recommendations: [
      'Upload back and side panels before re-running screening.',
      'This capture is insufficient for a meaningful preliminary assessment.',
    ],
    review: { status: 'pending', notes: '', confirmed: false },
    disclaimer: DISCLAIMER,
  },
}

export const demoScanIds = {
  pass: 'NN-2026-10482',
  issue: 'NN-2026-10461',
  review: 'NN-2026-10440',
  critical: 'NN-2026-10398',
}

export const dashboardStats = {
  total: 1284,
  passed: 812,
  issues: 301,
  review: 126,
  critical: 45,
}

export const recentScans = Object.values(mockScans).sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
)

export function getScanById(id) {
  return mockScans[id] || null
}

export function getScanByDemoKey(key) {
  const id = demoScanIds[key] || demoScanIds.pass
  return mockScans[id]
}
