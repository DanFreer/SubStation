/**
 * Finished-artwork transforms: crop → FIT/FILL/STRETCH into finished media,
 * then mirror before tiling (preview/PDF). Tiling still uses finished W×H.
 */

import type { FitMode } from '../types'
import { FULL_CROP, type CropRectNorm } from '../types/geometry'

export type MirrorAxis = 'horizontal' | 'none'

export { FULL_CROP }

export interface PlacementRect {
  /** Source pixels within the image. */
  sx: number
  sy: number
  sw: number
  sh: number
  /** Placement in finished-artwork inches. */
  dx: number
  dy: number
  dw: number
  dh: number
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/** Normalize and clamp a crop rect; falls back to full image when invalid. */
export function normalizeCrop(crop?: CropRectNorm | null): CropRectNorm {
  if (!crop) return { ...FULL_CROP }
  const x = clamp01(crop.x)
  const y = clamp01(crop.y)
  const width = clamp01(crop.width)
  const height = clamp01(crop.height)
  const maxW = Math.max(0, 1 - x)
  const maxH = Math.max(0, 1 - y)
  const w = Math.min(width, maxW)
  const h = Math.min(height, maxH)
  if (w <= 1e-9 || h <= 1e-9) return { ...FULL_CROP }
  return { x, y, width: w, height: h }
}

/**
 * Map crop region into finished media via FIT / FILL / STRETCH.
 * Returns source pixel rect and destination inches within finished media.
 */
export function placementForCrop(params: {
  crop: CropRectNorm
  imageWidthPx: number
  imageHeightPx: number
  finishedWidthIn: number
  finishedHeightIn: number
  fitMode: FitMode
}): PlacementRect {
  const crop = normalizeCrop(params.crop)
  const { imageWidthPx, imageHeightPx, finishedWidthIn, finishedHeightIn, fitMode } =
    params

  const cropSx = crop.x * imageWidthPx
  const cropSy = crop.y * imageHeightPx
  const cropSw = crop.width * imageWidthPx
  const cropSh = crop.height * imageHeightPx

  if (fitMode === 'STRETCH') {
    return {
      sx: cropSx,
      sy: cropSy,
      sw: cropSw,
      sh: cropSh,
      dx: 0,
      dy: 0,
      dw: finishedWidthIn,
      dh: finishedHeightIn,
    }
  }

  const cropAspect = cropSw / cropSh
  const mediaAspect = finishedWidthIn / finishedHeightIn

  if (fitMode === 'FIT') {
    // Letterbox: entire crop visible inside finished media
    if (cropAspect > mediaAspect) {
      const dw = finishedWidthIn
      const dh = dw / cropAspect
      return {
        sx: cropSx,
        sy: cropSy,
        sw: cropSw,
        sh: cropSh,
        dx: 0,
        dy: (finishedHeightIn - dh) / 2,
        dw,
        dh,
      }
    }
    const dh = finishedHeightIn
    const dw = dh * cropAspect
    return {
      sx: cropSx,
      sy: cropSy,
      sw: cropSw,
      sh: cropSh,
      dx: (finishedWidthIn - dw) / 2,
      dy: 0,
      dw,
      dh,
    }
  }

  // FILL: cover finished media; may crop further inside the crop region
  if (cropAspect > mediaAspect) {
    // Crop is wider — trim sides
    const sh = cropSh
    const sw = sh * mediaAspect
    const sx = cropSx + (cropSw - sw) / 2
    return {
      sx,
      sy: cropSy,
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: finishedWidthIn,
      dh: finishedHeightIn,
    }
  }
  const sw = cropSw
  const sh = sw / mediaAspect
  const sy = cropSy + (cropSh - sh) / 2
  return {
    sx: cropSx,
    sy,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: finishedWidthIn,
    dh: finishedHeightIn,
  }
}

/** Map a point in mirrored finished-artwork space back to source image space. */
export function sourceXForMirroredArt(
  artX: number,
  artworkWidth: number,
  mirror: boolean,
): number {
  if (!mirror) return artX
  return artworkWidth - artX
}

/**
 * Source rectangle (left, top, width, height) in unmirrored image space
 * that corresponds to a tile in finished (possibly mirrored) artwork space.
 *
 * When `placement` is omitted, assumes the full image stretches across
 * finished media (legacy Stage 3/4 behavior).
 */
export function sourceRectForTile(params: {
  artX: number
  artY: number
  artWidth: number
  artHeight: number
  artworkWidth: number
  mirror: boolean
  placement?: PlacementRect
  imageWidthPx?: number
  imageHeightPx?: number
}): { sx: number; sy: number; sw: number; sh: number } {
  const { artX, artY, artWidth, artHeight, artworkWidth, mirror } = params

  // Map tile into unmirrored finished-artwork space first
  let left = artX
  let right = artX + artWidth
  if (mirror) {
    left = artworkWidth - artX - artWidth
    right = artworkWidth - artX
  }
  const top = artY
  const bottom = artY + artHeight

  const placement = params.placement
  if (!placement) {
    // Legacy: full image = full finished media (stretch)
    return {
      sx: left,
      sy: top,
      sw: right - left,
      sh: bottom - top,
    }
  }

  const imgW = params.imageWidthPx ?? 1
  const imgH = params.imageHeightPx ?? 1

  // Intersection of tile with placed image in finished inches
  const ix0 = Math.max(left, placement.dx)
  const iy0 = Math.max(top, placement.dy)
  const ix1 = Math.min(right, placement.dx + placement.dw)
  const iy1 = Math.min(bottom, placement.dy + placement.dh)

  if (ix1 <= ix0 || iy1 <= iy0) {
    // Tile is entirely in letterbox — return 1×1 at crop origin (caller clears)
    return { sx: placement.sx, sy: placement.sy, sw: 1, sh: 1 }
  }

  const u0 = (ix0 - placement.dx) / placement.dw
  const u1 = (ix1 - placement.dx) / placement.dw
  const v0 = (iy0 - placement.dy) / placement.dh
  const v1 = (iy1 - placement.dy) / placement.dh

  const sx = placement.sx + u0 * placement.sw
  const sy = placement.sy + v0 * placement.sh
  const sw = Math.max(1 / imgW, (u1 - u0) * placement.sw)
  const sh = Math.max(1 / imgH, (v1 - v0) * placement.sh)

  return { sx, sy, sw, sh }
}

/**
 * Pixel dimensions of the active crop (for DPI).
 */
export function cropPixelSize(
  crop: CropRectNorm,
  imageWidthPx: number,
  imageHeightPx: number,
): { widthPx: number; heightPx: number } {
  const c = normalizeCrop(crop)
  return {
    widthPx: c.width * imageWidthPx,
    heightPx: c.height * imageHeightPx,
  }
}
