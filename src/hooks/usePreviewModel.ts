import { useMemo } from 'react'
import { calculateTiles, toInches } from '../engine'
import { cropPixelSize, normalizeCrop } from '../engine/imageProcessor'
import { calculateResolution } from '../engine/resolutionCalculator'
import type {
  ArtworkSettings,
  PaperSettings,
  SeamOverrides,
  TileCalculationResult,
  UploadedImage,
} from '../types'
import type { PrintSettings } from './usePrintSettings'
import { useDebouncedValue } from './useDebouncedValue'

export interface PreviewModelInput {
  image: UploadedImage | null
  artwork: ArtworkSettings
  paper: PaperSettings
  print: PrintSettings
  seams?: SeamOverrides | null
}

function marginsToInches(
  margins: PrintSettings['margins'],
  unit: PrintSettings['unit'],
) {
  return {
    top: toInches(margins.top, unit),
    right: toInches(margins.right, unit),
    bottom: toInches(margins.bottom, unit),
    left: toInches(margins.left, unit),
  }
}

/**
 * Debounced geometry + DPI shared by preview and summary.
 * Always calls Stage 2 `calculateTiles` — no UI-only fake counts.
 */
export function usePreviewModel(input: PreviewModelInput) {
  const artwork = useDebouncedValue(input.artwork, 150)
  const paper = useDebouncedValue(input.paper, 150)
  const print = useDebouncedValue(input.print, 150)
  const seams = useDebouncedValue(input.seams ?? null, 80)
  const image = input.image

  return useMemo(() => {
    const artW = toInches(artwork.width, artwork.unit)
    const artH = toInches(artwork.height, artwork.unit)
    const paperW = toInches(paper.width, paper.unit)
    const paperH = toInches(paper.height, paper.unit)
    const margins = marginsToInches(print.margins, print.unit)
    const overlap = toInches(print.overlap, print.unit)
    const crop = normalizeCrop(artwork.crop?.rect)

    let tileResult: TileCalculationResult | null = null
    if (artW > 0 && artH > 0 && paperW > 0 && paperH > 0) {
      tileResult = calculateTiles({
        artwork: { width: artW, height: artH },
        paper: { width: paperW, height: paperH },
        margins,
        overlap,
        orientation: print.orientationPreference,
        mirror: print.mirror,
        seams: seams ?? undefined,
      })
    }

    const cropPx =
      image && artW > 0 && artH > 0
        ? cropPixelSize(crop, image.widthPx, image.heightPx)
        : null

    const resolution =
      cropPx && artW > 0 && artH > 0
        ? calculateResolution({
            widthPx: cropPx.widthPx,
            heightPx: cropPx.heightPx,
            widthIn: artW,
            heightIn: artH,
          })
        : null

    return {
      artW,
      artH,
      paperW,
      paperH,
      margins,
      overlap,
      mirror: print.mirror,
      crop,
      fitMode: artwork.fitMode,
      tileResult,
      resolution,
      artwork,
      paper,
      image,
      /** PDF page size in points (transfer material × 72). */
      pdfPagePoints:
        paperW > 0 && paperH > 0
          ? { width: paperW * 72, height: paperH * 72 }
          : null,
    }
  }, [artwork, paper, print, image, seams])
}
