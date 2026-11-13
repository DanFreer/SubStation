import type {
  OrientationPreference,
  PaperOrientation,
  SeamOverrides,
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

/** Default minimum tile content (inches) when clamping seam overrides. */
export const DEFAULT_MIN_TILE_SIZE = 0.5

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

/**
 * Auto seam centers for N tiles: overlap centered on each seam.
 * Seam i (1-based among gaps) sits at i×step + overlap/2.
 */
export function autoSeamCenters(
  tileCount: number,
  usable: number,
  overlap: number,
): number[] {
  if (tileCount <= 1) return []
  const step = usable - overlap
  const seams: number[] = []
  for (let i = 1; i < tileCount; i += 1) {
    seams.push(i * step + overlap / 2)
  }
  return seams
}

/**
 * Clamp / snap seam centers so each tile keeps minTileSize of unique content,
 * stays ordered, and never exceeds usable (avoids gaps when overlap is centered).
 */
export function clampSeamCenters(
  seams: number[],
  artworkLength: number,
  overlap: number,
  minTileSize: number,
  usable?: number,
): number[] {
  const n = seams.length
  if (n === 0) return []

  const half = overlap / 2
  const minGap = Math.max(minTileSize, GEOMETRY_EPS)
  const stepMax =
    usable !== undefined && Number.isFinite(usable)
      ? Math.max(GEOMETRY_EPS, usable - overlap)
      : Number.POSITIVE_INFINITY

  // First seam: first tile width S+O/2 ≤ usable ⇒ S ≤ usable − O/2
  // Last seam: last tile width art−(S−O/2) ≤ usable ⇒ S ≥ art − usable + O/2
  const coverLo =
    usable !== undefined && Number.isFinite(usable)
      ? artworkLength - usable + half
      : half + minTileSize
  const coverHi =
    usable !== undefined && Number.isFinite(usable)
      ? usable - half
      : artworkLength - half - minTileSize

  const lo = Math.max(half + minTileSize, coverLo)
  const hi = Math.min(artworkLength - half - minTileSize, coverHi)

  if (hi + GEOMETRY_EPS < lo && n === 1) {
    // Artwork too constrained — pin to auto-ish center of allowed band
    return [(lo + hi) / 2]
  }

  const sorted = [...seams].map((s) => (Number.isFinite(s) ? s : lo))
  sorted.sort((a, b) => a - b)

  const out: number[] = []
  for (let i = 0; i < n; i += 1) {
    let s = sorted[i]!
    const minA = i === 0 ? lo : out[i - 1]! + minGap
    const maxFromPrev = i === 0 ? hi : out[i - 1]! + stepMax
    const maxAllowed = Math.min(hi - (n - 1 - i) * minGap, maxFromPrev)
    if (maxAllowed + GEOMETRY_EPS < minA) {
      s = (minA + maxAllowed) / 2
    } else {
      s = Math.min(Math.max(s, minA), maxAllowed)
    }
    out.push(s)
  }
  return out
}

function axisStarts(seams: number[], overlap: number): number[] {
  const half = overlap / 2
  return [0, ...seams.map((s) => s - half)]
}

function axisEnd(
  seams: number[],
  index: number,
  artworkLength: number,
  overlap: number,
): number {
  if (index < seams.length) {
    return seams[index]! + overlap / 2
  }
  return artworkLength
}

function buildTilesFromSeams(
  artwork: SizeInches,
  usable: SizeInches,
  verticalSeams: number[],
  horizontalSeams: number[],
  overlap: number,
): TileRect[] {
  const cols = verticalSeams.length + 1
  const rows = horizontalSeams.length + 1
  const xStarts = axisStarts(verticalSeams, overlap)
  const yStarts = axisStarts(horizontalSeams, overlap)
  const tiles: TileRect[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const artX = Math.max(0, xStarts[col]!)
      const artY = Math.max(0, yStarts[row]!)
      const endX = axisEnd(verticalSeams, col, artwork.width, overlap)
      const endY = axisEnd(horizontalSeams, row, artwork.height, overlap)
      const artWidth = Math.max(
        0,
        Math.min(usable.width, endX - artX, artwork.width - artX),
      )
      const artHeight = Math.max(
        0,
        Math.min(usable.height, endY - artY, artwork.height - artY),
      )
      const pageIndex = row * cols + col

      tiles.push({
        col,
        row,
        pageIndex,
        label: tileLabel(col, row),
        artX,
        artY,
        artWidth,
        artHeight,
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

function resolveSeamsForAxis(
  override: number[] | undefined,
  tileCount: number,
  artworkLength: number,
  usable: number,
  overlap: number,
  minTileSize: number,
): number[] {
  const auto = autoSeamCenters(tileCount, usable, overlap)
  if (!override || override.length !== tileCount - 1) {
    return auto
  }
  return clampSeamCenters(
    override,
    artworkLength,
    overlap,
    minTileSize,
    usable,
  )
}

function layoutForPaper(
  artwork: SizeInches,
  paper: SizeInches,
  margins: TileCalculationInput['margins'],
  overlap: number,
  seams: SeamOverrides | undefined,
  minTileSize: number,
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

  const verticalSeams = resolveSeamsForAxis(
    seams?.vertical,
    cols,
    artwork.width,
    usableW,
    overlap,
    minTileSize,
  )
  const horizontalSeams = resolveSeamsForAxis(
    seams?.horizontal,
    rows,
    artwork.height,
    usableH,
    overlap,
    minTileSize,
  )

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
    verticalSeams,
    horizontalSeams,
    tiles: buildTilesFromSeams(
      artwork,
      { width: usableW, height: usableH },
      verticalSeams,
      horizontalSeams,
      overlap,
    ),
  }

  // Sanity: coverage must fully contain artwork (no gaps) for auto metric;
  // seam overrides still require every art point to be covered by some tile.
  if (
    coverage.width + GEOMETRY_EPS < artwork.width ||
    coverage.height + GEOMETRY_EPS < artwork.height
  ) {
    return { ok: false, error: 'Computed coverage does not fully cover artwork' }
  }

  const samplesX = sampleAxis(artwork.width)
  const samplesY = sampleAxis(artwork.height)
  for (const x of samplesX) {
    for (const y of samplesY) {
      const covered = layout.tiles.some(
        (t) =>
          x >= t.artX - GEOMETRY_EPS &&
          x <= t.artX + t.artWidth + GEOMETRY_EPS &&
          y >= t.artY - GEOMETRY_EPS &&
          y <= t.artY + t.artHeight + GEOMETRY_EPS,
      )
      if (!covered) {
        return {
          ok: false,
          error: 'Seam overrides leave a gap in artwork coverage',
        }
      }
    }
  }

  return { ok: true, layout }
}

function sampleAxis(length: number): number[] {
  if (length <= GEOMETRY_EPS) return [0]
  const n = 5
  const out: number[] = []
  for (let i = 0; i < n; i += 1) {
    out.push((i / (n - 1)) * Math.max(0, length - 1e-6))
  }
  return out
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
  const minTileSize =
    input.minTileSize !== undefined && Number.isFinite(input.minTileSize)
      ? Math.max(0, input.minTileSize)
      : DEFAULT_MIN_TILE_SIZE

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
    const result = layoutForPaper(
      artwork,
      candidate,
      margins,
      ov,
      input.seams,
      minTileSize,
    )
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
