import { describe, expect, it } from 'vitest'
import { coverageAlongAxis, nearlyEqual, zeroMargins } from './printGeometry'
import { calculateTiles, clampSeamCenters } from './tileCalculator'

const letter = { width: 8.5, height: 11 }
const tabloid = { width: 11, height: 17 }

describe('tileCalculator — plan scenarios', () => {
  it('1: 8×10 art, Letter, 0 margins → 1 page', () => {
    const result = calculateTiles({
      artwork: { width: 8, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.pageCount).toBe(1)
    expect(result.layout.cols).toBe(1)
    expect(result.layout.rows).toBe(1)
  })

  it('2: 14×17, Letter, 0 overlap/margins → 4 pages, 2×2', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.cols).toBe(2)
    expect(result.layout.rows).toBe(2)
    expect(result.layout.pageCount).toBe(4)
    expect(result.layout.tiles).toHaveLength(4)
  })

  it('3: 14×17, Letter, 0.25 overlap → full coverage, no gaps', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const { layout } = result
    expect(layout.coverage.width + 1e-9).toBeGreaterThanOrEqual(14)
    expect(layout.coverage.height + 1e-9).toBeGreaterThanOrEqual(17)

    // Every artwork point along a sample grid is covered by at least one tile
    const samples = [0, 3.5, 7, 10.5, 13.999]
    for (const x of samples) {
      for (const y of samples.map((v) => (v / 14) * 17)) {
        const covered = layout.tiles.some(
          (t) =>
            x >= t.artX - 1e-9 &&
            x <= t.artX + t.artWidth + 1e-9 &&
            y >= t.artY - 1e-9 &&
            y <= t.artY + t.artHeight + 1e-9,
        )
        expect(covered).toBe(true)
      }
    }
  })

  it('4: 10×8 on Letter → 1 page with auto landscape orientation', () => {
    const result = calculateTiles({
      artwork: { width: 10, height: 8 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'auto',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.pageCount).toBe(1)
    expect(result.layout.orientation).toBe('landscape')
    expect(result.layout.paper.width).toBeGreaterThan(result.layout.paper.height)
    expect(result.layout.tiles[0]?.artX).toBe(0)
    expect(result.layout.tiles[0]?.artY).toBe(0)
    expect(result.layout.tiles[0]?.artWidth).toBeCloseTo(10, 6)
    expect(result.layout.tiles[0]?.artHeight).toBeCloseTo(8, 6)
  })

  it('5: 20×30 on Tabloid → valid multi-page layout', () => {
    const result = calculateTiles({
      artwork: { width: 20, height: 30 },
      paper: tabloid,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'auto',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.pageCount).toBeGreaterThan(1)
    expect(Number.isFinite(result.layout.pageCount)).toBe(true)
    expect(result.layout.coverage.width).toBeGreaterThanOrEqual(20 - 1e-9)
    expect(result.layout.coverage.height).toBeGreaterThanOrEqual(30 - 1e-9)
  })

  it('6: 14×17 Letter with 0.25 margins → usable 8×10.5 in', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.usable.width).toBeCloseTo(8, 6)
    expect(result.layout.usable.height).toBeCloseTo(10.5, 6)
  })

  it('7: mirror flag does not change tiling (same finished size)', () => {
    const base = {
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait' as const,
    }
    const plain = calculateTiles({ ...base, mirror: false })
    const mirrored = calculateTiles({ ...base, mirror: true })
    expect(plain.ok && mirrored.ok).toBe(true)
    if (!plain.ok || !mirrored.ok) return
    expect(mirrored.layout.pageCount).toBe(plain.layout.pageCount)
    expect(mirrored.layout.cols).toBe(plain.layout.cols)
    expect(mirrored.layout.rows).toBe(plain.layout.rows)
    expect(mirrored.layout.tiles.map((t) => t.label)).toEqual(
      plain.layout.tiles.map((t) => t.label),
    )
  })

  it('8: extreme aspect ratio → finite valid layout', () => {
    const result = calculateTiles({
      artwork: { width: 0.5, height: 100 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.1,
      orientation: 'auto',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Number.isFinite(result.layout.pageCount)).toBe(true)
    expect(result.layout.pageCount).toBeGreaterThan(0)
    expect(result.layout.pageCount).toBeLessThan(10_000)
  })

  it('9: zero overlap → adjacent tiles meet with no gap/dup strip', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const { layout } = result
    expect(layout.overlap).toBe(0)

    // Horizontal neighbors: right edge of left tile equals left edge of right tile
    const a1 = layout.tiles.find((t) => t.col === 0 && t.row === 0)!
    const b1 = layout.tiles.find((t) => t.col === 1 && t.row === 0)!
    expect(a1.artX + a1.artWidth).toBeCloseTo(b1.artX, 9)

    // Vertical neighbors
    const a2 = layout.tiles.find((t) => t.col === 0 && t.row === 1)!
    expect(a1.artY + a1.artHeight).toBeCloseTo(a2.artY, 9)

    // Coverage equals exact multiples (no overlap inflation)
    expect(
      nearlyEqual(
        layout.coverage.width,
        coverageAlongAxis(layout.cols, layout.usable.width, 0),
      ),
    ).toBe(true)
  })

  it('10: custom paper uses supplied dimensions', () => {
    const custom = { width: 13, height: 19 }
    const result = calculateTiles({
      artwork: { width: 20, height: 20 },
      paper: custom,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.paper.width).toBeCloseTo(13, 6)
    expect(result.layout.paper.height).toBeCloseTo(19, 6)
    expect(result.layout.usable.width).toBeCloseTo(13, 6)
    expect(result.layout.usable.height).toBeCloseTo(19, 6)
    expect(result.layout.cols).toBe(2)
    expect(result.layout.rows).toBe(2)
    expect(result.layout.pageCount).toBe(4)
  })
}
)

describe('tileCalculator — boundaries', () => {
  it('rejects non-positive artwork dimensions', () => {
    const result = calculateTiles({
      artwork: { width: 0, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects non-positive paper dimensions', () => {
    const result = calculateTiles({
      artwork: { width: 8, height: 10 },
      paper: { width: -1, height: 11 },
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects negative overlap', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: -0.1,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects overlap ≥ usable when multiple tiles are required', () => {
    const result = calculateTiles({
      artwork: { width: 20, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 8.5,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(false)
  })

  it('float rounding: artwork slightly over one tile still covers fully', () => {
    const almost = 8.5 + 1e-8
    const result = calculateTiles({
      artwork: { width: almost, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.coverage.width + 1e-9).toBeGreaterThanOrEqual(almost)
  })

  it('auto picks lower page count over alternate orientation', () => {
    // 16×10: portrait Letter needs more sheets than landscape
    const result = calculateTiles({
      artwork: { width: 16, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'auto',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const portraitOnly = calculateTiles({
      artwork: { width: 16, height: 10 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0,
      orientation: 'portrait',
    })
    expect(portraitOnly.ok).toBe(true)
    if (!portraitOnly.ok) return
    expect(result.layout.pageCount).toBeLessThanOrEqual(portraitOnly.layout.pageCount)
  })
})

describe('tileCalculator — seam overrides (Stage 7)', () => {
  it('auto layout exposes seam centers with overlap centered', () => {
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const { layout } = result
    expect(layout.verticalSeams).toHaveLength(layout.cols - 1)
    expect(layout.horizontalSeams).toHaveLength(layout.rows - 1)

    const seam = layout.verticalSeams[0]!
    const left = layout.tiles.find((t) => t.col === 0 && t.row === 0)!
    const right = layout.tiles.find((t) => t.col === 1 && t.row === 0)!
    // Overlap centered on seam: left ends at seam+O/2, right starts at seam−O/2
    expect(left.artX + left.artWidth).toBeCloseTo(seam + layout.overlap / 2, 6)
    expect(right.artX).toBeCloseTo(seam - layout.overlap / 2, 6)
  })

  it('accepts vertical seam overrides and keeps finished media size', () => {
    const auto = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
    })
    expect(auto.ok).toBe(true)
    if (!auto.ok) return

    // Shift left within the coverable band (auto seam ≈ 8.375; floor ≈ 5.625)
    const shifted = auto.layout.verticalSeams.map((s) => s - 0.75)
    const result = calculateTiles({
      artwork: { width: 14, height: 17 },
      paper: letter,
      margins: zeroMargins(),
      overlap: 0.25,
      orientation: 'portrait',
      seams: {
        vertical: shifted,
        horizontal: auto.layout.horizontalSeams,
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.layout.artwork.width).toBe(14)
    expect(result.layout.artwork.height).toBe(17)
    expect(result.layout.pageCount).toBe(auto.layout.pageCount)
    expect(result.layout.verticalSeams[0]).toBeLessThan(
      auto.layout.verticalSeams[0]! - 0.2,
    )

    const seam = result.layout.verticalSeams[0]!
    const left = result.layout.tiles.find((t) => t.col === 0)!
    const right = result.layout.tiles.find((t) => t.col === 1)!
    expect(left.artX + left.artWidth).toBeCloseTo(seam + 0.125, 5)
    expect(right.artX).toBeCloseTo(seam - 0.125, 5)
  })

  it('clamps seams to min tile size and usable coverage', () => {
    const clamped = clampSeamCenters([0.1], 14, 0.25, 0.5, 8.5)
    // Must stay within [art−usable+O/2, usable−O/2] = [5.625, 8.375]
    expect(clamped[0]!).toBeGreaterThanOrEqual(5.625 - 1e-9)
    expect(clamped[0]!).toBeLessThanOrEqual(8.375 + 1e-9)
  })
})
