/**
 * Stage 3 helpers for finished-artwork transforms.
 * Mirror is applied to the full finished piece before tiling (preview/PDF).
 * Tiling itself still uses finished W×H only (see calculateTiles).
 */

export type MirrorAxis = 'horizontal' | 'none'

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
 */
export function sourceRectForTile(params: {
  artX: number
  artY: number
  artWidth: number
  artHeight: number
  artworkWidth: number
  mirror: boolean
}): { sx: number; sy: number; sw: number; sh: number } {
  const { artX, artY, artWidth, artHeight, artworkWidth, mirror } = params
  if (!mirror) {
    return { sx: artX, sy: artY, sw: artWidth, sh: artHeight }
  }
  // Horizontal mirror of finished art: tile [artX, artX+artWidth] maps to
  // source [W - artX - artWidth, W - artX].
  const sx = artworkWidth - artX - artWidth
  return { sx, sy: artY, sw: artWidth, sh: artHeight }
}
