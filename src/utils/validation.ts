import type { ArtworkSettings, PaperSettings } from '../types'
import type { PrintSettings } from '../hooks/usePrintSettings'
import { toInches } from './units'

export interface ValidationIssue {
  field: string
  message: string
}

export function validateArtwork(settings: ArtworkSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!Number.isFinite(settings.width) || settings.width <= 0) {
    issues.push({ field: 'artwork.width', message: 'Artwork width must be greater than 0' })
  }
  if (!Number.isFinite(settings.height) || settings.height <= 0) {
    issues.push({ field: 'artwork.height', message: 'Artwork height must be greater than 0' })
  }
  const wIn = toInches(settings.width, settings.unit)
  const hIn = toInches(settings.height, settings.unit)
  if (wIn > 200 || hIn > 200) {
    issues.push({
      field: 'artwork.size',
      message: 'Artwork size is unusually large (>200 in); check units',
    })
  }
  return issues
}

export function validatePaper(settings: PaperSettings): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!Number.isFinite(settings.width) || settings.width <= 0) {
    issues.push({ field: 'paper.width', message: 'Paper width must be greater than 0' })
  }
  if (!Number.isFinite(settings.height) || settings.height <= 0) {
    issues.push({ field: 'paper.height', message: 'Paper height must be greater than 0' })
  }
  return issues
}

export function validatePrint(
  print: PrintSettings,
  paper: PaperSettings,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const sides = ['top', 'right', 'bottom', 'left'] as const
  for (const side of sides) {
    const v = print.margins[side]
    if (!Number.isFinite(v) || v < 0) {
      issues.push({
        field: `margins.${side}`,
        message: `Margin "${side}" must be zero or positive`,
      })
    }
  }
  if (!Number.isFinite(print.overlap) || print.overlap < 0) {
    issues.push({ field: 'overlap', message: 'Overlap must be zero or positive' })
  }

  const paperW = toInches(paper.width, paper.unit)
  const paperH = toInches(paper.height, paper.unit)
  const m = {
    top: toInches(print.margins.top, print.unit),
    right: toInches(print.margins.right, print.unit),
    bottom: toInches(print.margins.bottom, print.unit),
    left: toInches(print.margins.left, print.unit),
  }
  const usableW = paperW - m.left - m.right
  const usableH = paperH - m.top - m.bottom
  if (usableW <= 0 || usableH <= 0) {
    issues.push({
      field: 'margins',
      message: 'Margins leave no printable area on the selected paper',
    })
  }
  const overlapIn = toInches(print.overlap, print.unit)
  if (usableW > 0 && overlapIn >= usableW) {
    issues.push({
      field: 'overlap',
      message: 'Overlap must be smaller than usable paper width',
    })
  }
  if (usableH > 0 && overlapIn >= usableH) {
    issues.push({
      field: 'overlap',
      message: 'Overlap must be smaller than usable paper height',
    })
  }
  return issues
}

export function validateAll(params: {
  artwork: ArtworkSettings
  paper: PaperSettings
  print: PrintSettings
}): ValidationIssue[] {
  return [
    ...validateArtwork(params.artwork),
    ...validatePaper(params.paper),
    ...validatePrint(params.print, params.paper),
  ]
}

/** Soft warning for very large uploads (browser memory). */
export const LARGE_IMAGE_BYTES = 40 * 1024 * 1024
export const LARGE_IMAGE_PIXELS = 40_000_000

export function imageSizeWarning(file: File, widthPx: number, heightPx: number): string | null {
  if (file.size >= LARGE_IMAGE_BYTES) {
    return 'This image is very large (>40 MB). Preview/PDF may be slow or run out of memory.'
  }
  if (widthPx * heightPx >= LARGE_IMAGE_PIXELS) {
    return 'This image has a very high pixel count. Consider a smaller export for smoother tiling.'
  }
  return null
}
