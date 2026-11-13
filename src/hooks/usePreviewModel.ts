import { useMemo } from 'react'
import { calculateTiles, toInches } from '../engine'
import { calculateResolution } from '../engine/resolutionCalculator'
import type {
  ArtworkSettings,
  PaperSettings,
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
  const image = input.image

  return useMemo(() => {
    const artW = toInches(artwork.width, artwork.unit)
    const artH = toInches(artwork.height, artwork.unit)
    const paperW = toInches(paper.width, paper.unit)
    const paperH = toInches(paper.height, paper.unit)
    const margins = marginsToInches(print.margins, print.unit)
    const overlap = toInches(print.overlap, print.unit)

    let tileResult: TileCalculationResult | null = null
    if (artW > 0 && artH > 0 && paperW > 0 && paperH > 0) {
      tileResult = calculateTiles({
        artwork: { width: artW, height: artH },
        paper: { width: paperW, height: paperH },
        margins,
        overlap,
        orientation: print.orientationPreference,
        mirror: print.mirror,
      })
    }

    const resolution =
      image && artW > 0 && artH > 0
        ? calculateResolution({
            widthPx: image.widthPx,
            heightPx: image.heightPx,
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
      tileResult,
      resolution,
      artwork,
      paper,
      image,
    }
  }, [artwork, paper, print, image])
}
