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

  it('PDF page physical size equals transfer material (inches × 72 pt)', async () => {
    const transfer = { width: 8.5, height: 11 }
    const finished = { width: 14, height: 17 }
    const tileResult = calculateTiles({
      artwork: finished,
      paper: transfer,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
    })
    expect(tileResult.ok).toBe(true)
    if (!tileResult.ok) return

    const { layout } = tileResult
    // Finished media size preserved in layout
    expect(layout.artwork.width).toBe(finished.width)
    expect(layout.artwork.height).toBe(finished.height)
    // Transfer material drives page size
    expect(layout.paper.width).toBe(transfer.width)
    expect(layout.paper.height).toBe(transfer.height)

    const result = await generatePdf({
      layout,
      margins: zeroMargins(),
      mirror: false,
      marks: {
        cropMarks: false,
        registrationMarks: false,
        tileLabels: false,
        pageNumbers: false,
      },
      imageBytes: TINY_PNG,
      imageMime: 'image/png',
      tilePngBytes: layout.tiles.map(() => TINY_PNG),
      paperPresetId: 'letter',
    })

    const doc = await PDFDocument.load(result.bytes)
    for (let i = 0; i < doc.getPageCount(); i += 1) {
      const { width, height } = doc.getPage(i).getSize()
      expect(width).toBeCloseTo(transfer.width * 72, 5)
      expect(height).toBeCloseTo(transfer.height * 72, 5)
    }
  })

  it('seam overrides produce the same PDF page size as auto seams', async () => {
    const base = {
      artwork: { width: 14, height: 17 },
      paper: { width: 8.5, height: 11 },
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait' as const,
    }
    const auto = calculateTiles(base)
    expect(auto.ok).toBe(true)
    if (!auto.ok) return

    const overridden = calculateTiles({
      ...base,
      seams: {
        vertical: auto.layout.verticalSeams.map((s) => s - 0.4),
        horizontal: auto.layout.horizontalSeams.map((s) => s - 0.3),
      },
    })
    expect(overridden.ok).toBe(true)
    if (!overridden.ok) return

    expect(overridden.layout.artwork).toEqual(auto.layout.artwork)
    expect(paperSizePoints(overridden.layout)).toEqual(paperSizePoints(auto.layout))

    const result = await generatePdf({
      layout: overridden.layout,
      margins: zeroMargins(),
      mirror: false,
      marks: {
        cropMarks: false,
        registrationMarks: false,
        tileLabels: false,
        pageNumbers: false,
      },
      imageBytes: TINY_PNG,
      imageMime: 'image/png',
      tilePngBytes: overridden.layout.tiles.map(() => TINY_PNG),
    })
    const doc = await PDFDocument.load(result.bytes)
    const { width, height } = doc.getPage(0).getSize()
    expect(width).toBeCloseTo(8.5 * 72, 5)
    expect(height).toBeCloseTo(11 * 72, 5)
  })
})
