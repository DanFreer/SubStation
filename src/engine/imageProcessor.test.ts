import { describe, expect, it } from 'vitest'
import {
  placementForCrop,
  sourceRectForTile,
  sourceXForMirroredArt,
} from './imageProcessor'

describe('imageProcessor mirror mapping', () => {
  it('leaves coords unchanged when mirror is off', () => {
    expect(sourceXForMirroredArt(2, 10, false)).toBe(2)
    expect(
      sourceRectForTile({
        artX: 1,
        artY: 2,
        artWidth: 3,
        artHeight: 4,
        artworkWidth: 14,
        mirror: false,
      }),
    ).toEqual({ sx: 1, sy: 2, sw: 3, sh: 4 })
  })

  it('maps tile rects through horizontal mirror before sampling', () => {
    // Finished W=14; tile at artX=0 width=8 → source starts at 6
    expect(
      sourceRectForTile({
        artX: 0,
        artY: 0,
        artWidth: 8,
        artHeight: 10,
        artworkWidth: 14,
        mirror: true,
      }),
    ).toEqual({ sx: 6, sy: 0, sw: 8, sh: 10 })

    expect(sourceXForMirroredArt(0, 14, true)).toBe(14)
    expect(sourceXForMirroredArt(14, 14, true)).toBe(0)
  })
})

describe('imageProcessor crop → finished media', () => {
  it('STRETCH maps full crop onto finished media', () => {
    const p = placementForCrop({
      crop: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
      imageWidthPx: 1000,
      imageHeightPx: 800,
      finishedWidthIn: 10,
      finishedHeightIn: 8,
      fitMode: 'STRETCH',
    })
    expect(p.sx).toBeCloseTo(100, 5)
    expect(p.sy).toBeCloseTo(160, 5)
    expect(p.sw).toBeCloseTo(500, 5)
    expect(p.sh).toBeCloseTo(320, 5)
    expect(p.dx).toBe(0)
    expect(p.dy).toBe(0)
    expect(p.dw).toBe(10)
    expect(p.dh).toBe(8)
  })

  it('FIT letterboxes a wide crop into tall finished media', () => {
    const p = placementForCrop({
      crop: { x: 0, y: 0, width: 1, height: 1 },
      imageWidthPx: 200,
      imageHeightPx: 100,
      finishedWidthIn: 10,
      finishedHeightIn: 10,
      fitMode: 'FIT',
    })
    expect(p.dw).toBeCloseTo(10, 6)
    expect(p.dh).toBeCloseTo(5, 6)
    expect(p.dx).toBeCloseTo(0, 6)
    expect(p.dy).toBeCloseTo(2.5, 6)
  })
})
