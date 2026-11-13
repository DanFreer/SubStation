import type {
  OrientationPreference,
  PaperOrientation,
  SizeInches,
  TileCalculationInput,
  TileCalculationResult,
  TileLayout,
  TileRect,
} from '../types/geometry'
import {
  GEOMETRY_EPS,
  computeUsableArea,
  coverageAlongAxis,
  isPositiveSize,
  swapSize,
  tilesNeededAlongAxis,
} from './printGeometry'

function tileLabel(col: number, row: number): string {
  // A1, B1, … Z1, AA1, …
  let n = col
  let colLabel = ''
  do {
    colLabel = String.fromCharCode(65 + (n % 26)) + colLabel
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return `${colLabel}${row + 1}`
}

function buildTiles(
  artwork: SizeInches,
  usable: SizeInches,
  cols: number,
  rows: number,
  overlap: number,
): TileRect[] {
  const stepX = usable.width - overlap
  const stepY = usable.height - overlap
  const tiles: TileRect[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const artX = col * stepX
      const artY = row * stepY
      const artWidth = Math.min(usable.width, artwork.width - artX)
      const artHeight = Math.min(usable.height, artwork.height - artY)
      const pageIndex = row * cols + col

      tiles.push({
        col,
        row,
        pageIndex,
        label: tileLabel(col, row),
        artX,
        artY,
        artWidth: Math.max(0, artWidth),
        artHeight: Math.max(0, artHeight),
        pageX: 0,
        pageY: 0,
      })
    }
  }

  return tiles
}

function orientationOf(paper: SizeInches): PaperOrientation {
  return paper.width >= paper.height ? 'landscape' : 'portrait'
}

function layoutForPaper(
  artwork: SizeInches,
  paper: SizeInches,
  margins: TileCalculationInput['margins'],
  overlap: number,
): TileCalculationResult {
  const usableResult = computeUsableArea(paper, margins)
  if (usableResult.ok === false) {
    return { ok: false, error: usableResult.error }
  }

  const { width: usableW, height: usableH } = usableResult.usable

  const colsResult = tilesNeededAlongAxis(artwork.width, usableW, overlap)
  if (colsResult.ok === false) {
    return { ok: false, error: colsResult.error }
  }
  const rowsResult = tilesNeededAlongAxis(artwork.height, usableH, overlap)
  if (rowsResult.ok === false) {
    return { ok: false, error: rowsResult.error }
  }

  const cols = colsResult.count
  const rows = rowsResult.count
  const coverage: SizeInches = {
    width: coverageAlongAxis(cols, usableW, overlap),
    height: coverageAlongAxis(rows, usableH, overlap),
  }
  const pageCount = cols * rows
  const unusedPrintableArea =
    pageCount * usableW * usableH - artwork.width * artwork.height

  const layout: TileLayout = {
    cols,
    rows,
    pageCount,
    orientation: orientationOf(paper),
    overlap,
    paper: { ...paper },
    usable: { width: usableW, height: usableH },
    artwork: { ...artwork },
    coverage,
    unusedPrintableArea,
    tiles: buildTiles(artwork, { width: usableW, height: usableH }, cols, rows, overlap),
  }

  // Sanity: coverage must fully contain artwork (no gaps)
  if (
    coverage.width + GEOMETRY_EPS < artwork.width ||
    coverage.height + GEOMETRY_EPS < artwork.height
  ) {
    return { ok: false, error: 'Computed coverage does not fully cover artwork' }
  }

  return { ok: true, layout }
}

function candidatesForOrientation(
  preference: OrientationPreference,
  paper: SizeInches,
): SizeInches[] {
  if (preference === 'auto') {
    const swapped = swapSize(paper)
    // Deduplicate square paper
    if (
      Math.abs(paper.width - swapped.width) < GEOMETRY_EPS &&
      Math.abs(paper.height - swapped.height) < GEOMETRY_EPS
    ) {
      return [paper]
    }
    return [paper, swapped]
  }

  const wantLandscape = preference === 'landscape'
  const isLandscape = paper.width >= paper.height
  if (wantLandscape === isLandscape) return [paper]
  return [swapSize(paper)]
}

/**
 * Compute tiling for finished artwork size on paper with margins + overlap.
 * Internal units: inches. Independent of React / canvas / PDF.
 */
export function calculateTiles(input: TileCalculationInput): TileCalculationResult {
  const { artwork, paper, margins, orientation } = input
  const overlap = input.overlap

  if (!isPositiveSize(artwork)) {
    return { ok: false, error: 'Artwork dimensions must be positive' }
  }
  if (!isPositiveSize(paper)) {
    return { ok: false, error: 'Paper dimensions must be positive' }
  }
  if (!Number.isFinite(overlap) || overlap < -GEOMETRY_EPS) {
    return { ok: false, error: 'Overlap must be a finite non-negative number' }
  }
  const ov = Math.max(0, overlap)

  // Mirror flag is intentionally unused: tiling uses finished W×H only.
  void input.mirror

  const papers = candidatesForOrientation(orientation, paper)
  const layouts: TileLayout[] = []

  for (const candidate of papers) {
    const result = layoutForPaper(artwork, candidate, margins, ov)
    if (!result.ok) {
      // If only one orientation, surface the error; if auto, try the other.
      if (papers.length === 1) return result
      continue
    }
    layouts.push(result.layout)
  }

  if (layouts.length === 0) {
    return {
      ok: false,
      error: 'Unable to compute a valid tile layout for either paper orientation',
    }
  }

  layouts.sort((a, b) => {
    if (a.pageCount !== b.pageCount) return a.pageCount - b.pageCount
    if (a.unusedPrintableArea !== b.unusedPrintableArea) {
      return a.unusedPrintableArea - b.unusedPrintableArea
    }
    // Stable preference: portrait before landscape on remaining ties
    if (a.orientation !== b.orientation) {
      return a.orientation === 'portrait' ? -1 : 1
    }
    return 0
  })

  return { ok: true, layout: layouts[0]! }
}

/** Convenience: page count only (returns null on error). */
export function estimatePageCount(input: TileCalculationInput): number | null {
  const result = calculateTiles(input)
  return result.ok ? result.layout.pageCount : null
}
