import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type RGB,
} from 'pdf-lib'
import type { FitMode } from '../types'
import type {
  CropRectNorm,
  MarginsInches,
  TileLayout,
  TileRect,
} from '../types/geometry'
import { FULL_CROP, placementForCrop, sourceRectForTile } from './imageProcessor'
import { inchesToPdfPoints } from './printGeometry'

export interface PdfMarkOptions {
  cropMarks: boolean
  registrationMarks: boolean
  tileLabels: boolean
  pageNumbers: boolean
}

export interface GeneratePdfInput {
  layout: TileLayout
  margins: MarginsInches
  mirror: boolean
  marks: PdfMarkOptions
  /** Original uploaded image bytes. */
  imageBytes: Uint8Array
  imageMime: string
  /**
   * Optional pre-rasterized tile PNGs (one per pageIndex order).
   * When omitted, tiles are cropped in-browser via canvas (mirror-aware).
   */
  tilePngBytes?: Uint8Array[]
  paperPresetId?: string
  /** Normalized crop on source image (default full). */
  crop?: CropRectNorm
  /** How crop maps into finished media (default STRETCH for back-compat). */
  fitMode?: FitMode
}

export interface GeneratePdfResult {
  bytes: Uint8Array
  filename: string
  pageCount: number
}

const MARK_COLOR: RGB = rgb(0.15, 0.15, 0.18)
const MARK_LEN = inchesToPdfPoints(0.18)
const MARK_GAP = inchesToPdfPoints(0.06)

export function buildPdfFilename(params: {
  artWidthIn: number
  artHeightIn: number
  paperLabel: string
  pageCount: number
}): string {
  const w = trimDim(params.artWidthIn)
  const h = trimDim(params.artHeightIn)
  const paper = slug(params.paperLabel)
  return `sublimation-print-${w}x${h}-${paper}-${params.pageCount}-pages.pdf`
}

function trimDim(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function slug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'custom'
}

export function paperSizePoints(layout: TileLayout): { width: number; height: number } {
  return {
    width: inchesToPdfPoints(layout.paper.width),
    height: inchesToPdfPoints(layout.paper.height),
  }
}

/** PDF y from top-left layout inches (PDF origin is bottom-left). */
export function topLeftInchesToPdf(
  xIn: number,
  yIn: number,
  heightIn: number,
  pageHeightPt: number,
): { x: number; y: number; height: number } {
  const x = inchesToPdfPoints(xIn)
  const height = inchesToPdfPoints(heightIn)
  const y = pageHeightPt - inchesToPdfPoints(yIn) - height
  return { x, y, height }
}

/**
 * Build a multi-page PDF using the same TileLayout as preview.
 * Image content is mirrored before tiling when `mirror` is true.
 */
export async function generatePdf(
  input: GeneratePdfInput,
): Promise<GeneratePdfResult> {
  const { layout, margins, mirror, marks, imageBytes, imageMime } = input
  if (layout.pageCount < 1 || layout.tiles.length === 0) {
    throw new Error('Layout has no pages to export')
  }

  const tilePngs =
    input.tilePngBytes ??
    (await rasterizeTilesWithCanvas({
      layout,
      mirror,
      imageBytes,
      imageMime,
      crop: input.crop ?? FULL_CROP,
      fitMode: input.fitMode ?? 'STRETCH',
    }))

  if (tilePngs.length !== layout.tiles.length) {
    throw new Error('Tile image count does not match layout pages')
  }

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const size = paperSizePoints(layout)

  for (const tile of layout.tiles) {
    const page = pdf.addPage([size.width, size.height])
    const png = await pdf.embedPng(tilePngs[tile.pageIndex]!)

    const artLeft = margins.left + tile.pageX
    const artTop = margins.top + tile.pageY
    const placed = topLeftInchesToPdf(
      artLeft,
      artTop,
      tile.artHeight,
      size.height,
    )
    const artWidthPt = inchesToPdfPoints(tile.artWidth)

    page.drawImage(png, {
      x: placed.x,
      y: placed.y,
      width: artWidthPt,
      height: placed.height,
    })

    drawMarks(page, {
      layout,
      tile,
      margins,
      pageWidth: size.width,
      pageHeight: size.height,
      marks,
      font,
    })
  }

  const bytes = await pdf.save()
  const filename = buildPdfFilename({
    artWidthIn: layout.artwork.width,
    artHeightIn: layout.artwork.height,
    paperLabel: input.paperPresetId ?? `${layout.paper.width}x${layout.paper.height}`,
    pageCount: layout.pageCount,
  })

  return { bytes, filename, pageCount: layout.pageCount }
}

interface DrawMarksArgs {
  layout: TileLayout
  tile: TileRect
  margins: MarginsInches
  pageWidth: number
  pageHeight: number
  marks: PdfMarkOptions
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
}

function drawMarks(page: PDFPage, args: DrawMarksArgs): void {
  const { layout, tile, margins, pageWidth, pageHeight, marks, font } = args
  const usableLeft = margins.left
  const usableTop = margins.top
  const usableRight = layout.paper.width - margins.right
  const usableBottom = layout.paper.height - margins.bottom

  const artLeft = margins.left + tile.pageX
  const artTop = margins.top + tile.pageY
  const artRight = artLeft + tile.artWidth
  const artBottom = artTop + tile.artHeight

  if (marks.cropMarks) {
    drawCropMarks(page, artLeft, artTop, artRight, artBottom, pageHeight)
  }

  if (marks.registrationMarks) {
    const cx = (usableLeft + usableRight) / 2
    const cy = (usableTop + usableBottom) / 2
    drawRegistrationMark(page, cx, usableTop - 0.12, pageHeight)
    drawRegistrationMark(page, cx, usableBottom + 0.12, pageHeight)
    drawRegistrationMark(page, usableLeft - 0.12, cy, pageHeight)
    drawRegistrationMark(page, usableRight + 0.12, cy, pageHeight)
  }

  const labelSize = 8
  if (marks.tileLabels) {
    const label = tile.label
    const textWidth = font.widthOfTextAtSize(label, labelSize)
    const x = inchesToPdfPoints(artLeft)
    const y =
      pageHeight - inchesToPdfPoints(artTop) + MARK_GAP + 2
    // Prefer above art if margin allows; else below
    const yClamped =
      y + labelSize < pageHeight - 2
        ? y
        : pageHeight - inchesToPdfPoints(artBottom) - labelSize - MARK_GAP
    page.drawText(label, {
      x: Math.min(x, pageWidth - textWidth - 4),
      y: Math.max(2, Math.min(yClamped, pageHeight - labelSize - 2)),
      size: labelSize,
      font,
      color: MARK_COLOR,
    })
  }

  if (marks.pageNumbers) {
    const text = `Page ${tile.pageIndex + 1} / ${layout.pageCount}`
    const sizePt = 7
    const textWidth = font.widthOfTextAtSize(text, sizePt)
    page.drawText(text, {
      x: pageWidth - textWidth - inchesToPdfPoints(0.2),
      y: inchesToPdfPoints(0.15),
      size: sizePt,
      font,
      color: MARK_COLOR,
    })
  }
}

function drawCropMarks(
  page: PDFPage,
  leftIn: number,
  topIn: number,
  rightIn: number,
  bottomIn: number,
  pageHeight: number,
): void {
  const corners: Array<[number, number, 1 | -1, 1 | -1]> = [
    [leftIn, topIn, -1, -1],
    [rightIn, topIn, 1, -1],
    [leftIn, bottomIn, -1, 1],
    [rightIn, bottomIn, 1, 1],
  ]

  for (const [xin, yin, dx, dy] of corners) {
    const x = inchesToPdfPoints(xin)
    const y = pageHeight - inchesToPdfPoints(yin)
    // Horizontal hairline outside art
    page.drawLine({
      start: { x: x + dx * MARK_GAP, y },
      end: { x: x + dx * (MARK_GAP + MARK_LEN), y },
      thickness: 0.5,
      color: MARK_COLOR,
    })
    // Vertical hairline outside art
    page.drawLine({
      start: { x, y: y - dy * MARK_GAP },
      end: { x, y: y - dy * (MARK_GAP + MARK_LEN) },
      thickness: 0.5,
      color: MARK_COLOR,
    })
  }
}

function drawRegistrationMark(
  page: PDFPage,
  cxIn: number,
  cyIn: number,
  pageHeight: number,
): void {
  const cx = inchesToPdfPoints(cxIn)
  const cy = pageHeight - inchesToPdfPoints(cyIn)
  const r = inchesToPdfPoints(0.06)
  page.drawCircle({
    x: cx,
    y: cy,
    size: r,
    borderWidth: 0.6,
    borderColor: MARK_COLOR,
  })
  page.drawLine({
    start: { x: cx - r * 1.6, y: cy },
    end: { x: cx + r * 1.6, y: cy },
    thickness: 0.5,
    color: MARK_COLOR,
  })
  page.drawLine({
    start: { x: cx, y: cy - r * 1.6 },
    end: { x: cx, y: cy + r * 1.6 },
    thickness: 0.5,
    color: MARK_COLOR,
  })
}

async function rasterizeTilesWithCanvas(params: {
  layout: TileLayout
  mirror: boolean
  imageBytes: Uint8Array
  imageMime: string
  crop: CropRectNorm
  fitMode: FitMode
}): Promise<Uint8Array[]> {
  if (typeof document === 'undefined') {
    throw new Error(
      'Canvas rasterization requires a browser; pass tilePngBytes in Node/tests',
    )
  }

  const copy = new Uint8Array(params.imageBytes)
  const blob = new Blob([copy], {
    type: params.imageMime || 'image/png',
  })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadHtmlImage(url)
    const placement = placementForCrop({
      crop: params.crop,
      imageWidthPx: img.naturalWidth,
      imageHeightPx: img.naturalHeight,
      finishedWidthIn: params.layout.artwork.width,
      finishedHeightIn: params.layout.artwork.height,
      fitMode: params.fitMode,
    })
    const results: Uint8Array[] = []

    for (const tile of params.layout.tiles) {
      // Raster at ~150 px/in of tile for export quality; image pixels drive source
      const outW = Math.max(1, Math.round(tile.artWidth * 150))
      const outH = Math.max(1, Math.round(tile.artHeight * 150))
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not create canvas context for PDF tiles')
      ctx.clearRect(0, 0, outW, outH)

      const src = sourceRectForTile({
        artX: tile.artX,
        artY: tile.artY,
        artWidth: tile.artWidth,
        artHeight: tile.artHeight,
        artworkWidth: params.layout.artwork.width,
        mirror: params.mirror,
        placement,
        imageWidthPx: img.naturalWidth,
        imageHeightPx: img.naturalHeight,
      })

      // Map finished-art tile rect → destination on canvas; letterbox stays clear
      const tileLeft = params.mirror
        ? params.layout.artwork.width - tile.artX - tile.artWidth
        : tile.artX
      const tileTop = tile.artY
      const ix0 = Math.max(tileLeft, placement.dx)
      const iy0 = Math.max(tileTop, placement.dy)
      const ix1 = Math.min(tileLeft + tile.artWidth, placement.dx + placement.dw)
      const iy1 = Math.min(tileTop + tile.artHeight, placement.dy + placement.dh)

      if (ix1 > ix0 && iy1 > iy0) {
        const dx = ((ix0 - tileLeft) / tile.artWidth) * outW
        const dy = ((iy0 - tileTop) / tile.artHeight) * outH
        const dw = ((ix1 - ix0) / tile.artWidth) * outW
        const dh = ((iy1 - iy0) / tile.artHeight) * outH
        ctx.drawImage(
          img,
          src.sx,
          src.sy,
          src.sw,
          src.sh,
          dx,
          dy,
          dw,
          dh,
        )
      }

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))),
          'image/png',
        )
      })
      results.push(new Uint8Array(await pngBlob.arrayBuffer()))
    }

    return results
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode image for PDF export'))
    img.src = url
  })
}

export const PRINT_ACTUAL_SIZE_INSTRUCTIONS = [
  'Open the downloaded PDF.',
  'Choose Print.',
  'Set scale to Actual Size / 100% (disable "Fit to page").',
  'Confirm paper size matches the PDF page size.',
  'Print all pages, then assemble tiles using overlap/marks.',
].join(' ')
