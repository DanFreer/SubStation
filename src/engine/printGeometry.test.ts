import { describe, expect, it } from 'vitest'
import {
  computeUsableArea,
  coverageAlongAxis,
  inchesToPdfPoints,
  nearlyEqual,
  tilesNeededAlongAxis,
  uniformMargins,
  zeroMargins,
} from './printGeometry'

describe('printGeometry', () => {
  it('computes usable area as paper minus margins (plan test 6)', () => {
    const result = computeUsableArea(
      { width: 8.5, height: 11 },
      uniformMargins(0.25),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.usable.width).toBeCloseTo(8, 6)
    expect(result.usable.height).toBeCloseTo(10.5, 6)
  })

  it('rejects margins that consume the sheet', () => {
    const result = computeUsableArea(
      { width: 8.5, height: 11 },
      { top: 6, right: 0, bottom: 6, left: 0 },
    )
    expect(result.ok).toBe(false)
  })

  it('converts inches to PDF points at 72 pt/in', () => {
    expect(inchesToPdfPoints(1)).toBe(72)
    expect(inchesToPdfPoints(8.5)).toBeCloseTo(612, 6)
  })

  it('coverage formula: N×usable − (N−1)×overlap', () => {
    expect(coverageAlongAxis(1, 8.5, 0.25)).toBeCloseTo(8.5, 9)
    expect(coverageAlongAxis(2, 8.5, 0.25)).toBeCloseTo(16.75, 9)
    expect(coverageAlongAxis(2, 8.5, 0)).toBeCloseTo(17, 9)
  })

  it('tilesNeededAlongAxis handles exact fit and multi-tile', () => {
    expect(tilesNeededAlongAxis(8, 8.5, 0)).toEqual({ ok: true, count: 1 })
    expect(tilesNeededAlongAxis(14, 8.5, 0)).toEqual({ ok: true, count: 2 })
    expect(tilesNeededAlongAxis(17, 11, 0)).toEqual({ ok: true, count: 2 })
  })

  it('zero margins helper', () => {
    expect(zeroMargins()).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })
  })

  it('nearlyEqual tolerates float noise', () => {
    expect(nearlyEqual(1, 1 + 1e-9)).toBe(true)
    expect(nearlyEqual(1, 1.01)).toBe(false)
  })
})
