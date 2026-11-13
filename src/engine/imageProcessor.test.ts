import { describe, expect, it } from 'vitest'
import { sourceRectForTile, sourceXForMirroredArt } from './imageProcessor'

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
