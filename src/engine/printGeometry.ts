import type { MarginsInches, SizeInches, UsableArea } from '../types/geometry'
import { convertLength, fromInches, toInches } from '../utils/units'

export const PDF_POINTS_PER_INCH = 72

/** Floating-point tolerance for coverage / comparison (inches). */
export const GEOMETRY_EPS = 1e-9

export { convertLength, fromInches, toInches }

export function inchesToPdfPoints(inches: number): number {
  return inches * PDF_POINTS_PER_INCH
}

export function pdfPointsToInches(points: number): number {
  return points / PDF_POINTS_PER_INCH
}

export function uniformMargins(inches: number): MarginsInches {
  return { top: inches, right: inches, bottom: inches, left: inches }
}

export function zeroMargins(): MarginsInches {
  return uniformMargins(0)
}

export function isPositiveSize(size: SizeInches, eps = GEOMETRY_EPS): boolean {
  return size.width > eps && size.height > eps
}

export function validateMargins(
  margins: MarginsInches,
  eps = GEOMETRY_EPS,
): string | null {
  for (const [key, value] of Object.entries(margins) as [keyof MarginsInches, number][]) {
    if (!Number.isFinite(value) || value < -eps) {
      return `Margin "${key}" must be a finite non-negative number`
    }
  }
  return null
}

/**
 * Printable / usable area = paper − margins.
 * Returns an error string when margins consume the sheet.
 */
export function computeUsableArea(
  paper: SizeInches,
  margins: MarginsInches,
): { ok: true; usable: UsableArea } | { ok: false; error: string } {
  if (!isPositiveSize(paper)) {
    return { ok: false, error: 'Paper dimensions must be positive' }
  }
  const marginError = validateMargins(margins)
  if (marginError) return { ok: false, error: marginError }

  const width = paper.width - margins.left - margins.right
  const height = paper.height - margins.top - margins.bottom

  if (width <= GEOMETRY_EPS || height <= GEOMETRY_EPS) {
    return {
      ok: false,
      error: 'Margins leave no printable area (usable width/height must be positive)',
    }
  }

  return {
    ok: true,
    usable: {
      width,
      height,
      paper: { ...paper },
      margins: { ...margins },
    },
  }
}

/** Coverage length for N tiles along one axis with overlap. */
export function coverageAlongAxis(
  tileCount: number,
  usable: number,
  overlap: number,
): number {
  if (tileCount <= 0) return 0
  return tileCount * usable - (tileCount - 1) * overlap
}

/**
 * Minimum tile count along one axis so coverage ≥ artwork length.
 * Requires usable > overlap when more than one tile is needed.
 */
export function tilesNeededAlongAxis(
  artworkLength: number,
  usable: number,
  overlap: number,
): { ok: true; count: number } | { ok: false; error: string } {
  if (!Number.isFinite(artworkLength) || artworkLength <= GEOMETRY_EPS) {
    return { ok: false, error: 'Artwork dimensions must be positive' }
  }
  if (!Number.isFinite(usable) || usable <= GEOMETRY_EPS) {
    return { ok: false, error: 'Usable dimension must be positive' }
  }
  if (!Number.isFinite(overlap) || overlap < -GEOMETRY_EPS) {
    return { ok: false, error: 'Overlap must be a finite non-negative number' }
  }
  // Clamp tiny negative float noise to 0
  const ov = Math.max(0, overlap)

  if (artworkLength <= usable + GEOMETRY_EPS) {
    return { ok: true, count: 1 }
  }

  const step = usable - ov
  if (step <= GEOMETRY_EPS) {
    return {
      ok: false,
      error: 'Overlap must be smaller than the usable dimension when multiple tiles are required',
    }
  }

  // N × usable − (N−1) × overlap ≥ art  ⇒  N ≥ (art − overlap) / (usable − overlap)
  const raw = (artworkLength - ov) / step
  const count = Math.max(1, Math.ceil(raw - GEOMETRY_EPS))

  // Guard float edge cases: bump until coverage is sufficient
  let n = count
  while (coverageAlongAxis(n, usable, ov) + GEOMETRY_EPS < artworkLength) {
    n += 1
    if (n > 10_000) {
      return { ok: false, error: 'Tile count diverged; check dimensions and overlap' }
    }
  }

  return { ok: true, count: n }
}

export function swapSize(size: SizeInches): SizeInches {
  return { width: size.height, height: size.width }
}

export function nearlyEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps
}
