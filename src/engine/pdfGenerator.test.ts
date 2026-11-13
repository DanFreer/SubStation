import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { calculateTiles, zeroMargins } from './index'
import {
  buildPdfFilename,
  generatePdf,
  paperSizePoints,
  topLeftInchesToPdf,
} from './pdfGenerator'

/** 1×1 PNG (red pixel). */
const TINY_PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

describe('pdfGenerator helpers', () => {
  it('builds useful sublimation filenames', () => {
    expect(
      buildPdfFilename({
        artWidthIn: 14,
        artHeightIn: 17,
        paperLabel: 'Letter',
        pageCount: 4,
      }),
    ).toBe('sublimation-print-14x17-letter-4-pages.pdf')
  })

  it('converts Letter paper to PDF points', () => {
    const layout = calculateTiles({
      artwork: { width: 8, height: 10 },
      paper: { width: 8.5, height: 11 },
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(layout.ok).toBe(true)
    if (!layout.ok) return
    const size = paperSizePoints(layout.layout)
    expect(size.width).toBeCloseTo(612, 6)
    expect(size.height).toBeCloseTo(792, 6)
  })

  it('maps top-left inches into PDF bottom-left space', () => {
    const pageH = 792
    const placed = topLeftInchesToPdf(0.5, 1, 2, pageH)
    expect(placed.x).toBeCloseTo(36, 6)
    expect(placed.height).toBeCloseTo(144, 6)
    expect(placed.y).toBeCloseTo(pageH - 72 - 144, 6)
  })
})

describe('generatePdf', () => {
  it('exports multi-page PDF at paper size with tile count from engine', async () => {
    const tileResult = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: { width: 8.5, height: 11 },
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
      mirror: true,
    })
    expect(tileResult.ok).toBe(true)
    if (!tileResult.ok) return

    const { layout } = tileResult
    const tilePngBytes = layout.tiles.map(() => TINY_PNG)

    const result = await generatePdf({
      layout,
      margins: zeroMargins(),
      mirror: true,
      marks: {
        cropMarks: true,
        registrationMarks: true,
        tileLabels: true,
        pageNumbers: true,
      },
      imageBytes: TINY_PNG,
      imageMime: 'image/png',
      tilePngBytes,
      paperPresetId: 'letter',
    })

    expect(result.pageCount).toBe(layout.pageCount)
    expect(result.filename).toContain('letter')
    expect(result.filename).toContain(`${layout.pageCount}-pages`)
    expect(result.bytes.byteLength).toBeGreaterThan(100)

    const doc = await PDFDocument.load(result.bytes)
    expect(doc.getPageCount()).toBe(layout.pageCount)
    const page = doc.getPage(0)
    const { width, height } = page.getSize()
    expect(width).toBeCloseTo(612, 5)
    expect(height).toBeCloseTo(792, 5)
  })
})
