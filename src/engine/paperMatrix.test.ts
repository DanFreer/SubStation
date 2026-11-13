import { describe, expect, it } from 'vitest'
import { calculateTiles, zeroMargins } from './index'
import { PAPER_PRESETS } from '../utils/paperPresets'

describe('paper × orientation smoke matrix', () => {
  for (const preset of PAPER_PRESETS) {
    for (const orientation of ['portrait', 'landscape'] as const) {
      it(`${preset.id} ${orientation} tiles 14×17 with overlap`, () => {
        const paper =
          orientation === 'portrait'
            ? { width: preset.widthIn, height: preset.heightIn }
            : { width: preset.heightIn, height: preset.widthIn }
        const result = calculateTiles({
          artwork: { width: 14, height: 17 },
          paper,
          margins: zeroMargins(),
          overlap: 0.25,
          orientation: 'auto',
        })
        expect(result.ok).toBe(true)
        if (!result.ok) return
        expect(result.layout.pageCount).toBeGreaterThan(0)
        expect(Number.isFinite(result.layout.pageCount)).toBe(true)
        expect(result.layout.coverage.width).toBeGreaterThanOrEqual(14 - 1e-6)
        expect(result.layout.coverage.height).toBeGreaterThanOrEqual(17 - 1e-6)
      })
    }
  }
})
