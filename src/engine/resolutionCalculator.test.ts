import { describe, expect, it } from 'vitest'
import { calculateResolution, dpiBandFor } from './resolutionCalculator'

describe('resolutionCalculator', () => {
  it('computes min-axis DPI and excellent band at 300+', () => {
    const result = calculateResolution({
      widthPx: 3000,
      heightPx: 3600,
      widthIn: 10,
      heightIn: 12,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.dpi).toBeCloseTo(300, 6)
    expect(result.result.band.id).toBe('excellent')
  })

  it('uses the lower axis when aspects differ', () => {
    const result = calculateResolution({
      widthPx: 2000,
      heightPx: 1000,
      widthIn: 10,
      heightIn: 10,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.result.dpiX).toBeCloseTo(200, 6)
    expect(result.result.dpiY).toBeCloseTo(100, 6)
    expect(result.result.dpi).toBeCloseTo(100, 6)
    expect(result.result.band.id).toBe('fair')
  })

  it('classifies warning bands per plan thresholds', () => {
    expect(dpiBandFor(99).id).toBe('low')
    expect(dpiBandFor(100).id).toBe('fair')
    expect(dpiBandFor(149).id).toBe('fair')
    expect(dpiBandFor(150).id).toBe('good')
    expect(dpiBandFor(299).id).toBe('good')
    expect(dpiBandFor(300).id).toBe('excellent')
  })

  it('rejects invalid inputs without inventing DPI', () => {
    expect(
      calculateResolution({
        widthPx: 0,
        heightPx: 100,
        widthIn: 10,
        heightIn: 10,
      }).ok,
    ).toBe(false)
    expect(
      calculateResolution({
        widthPx: 100,
        heightPx: 100,
        widthIn: -1,
        heightIn: 10,
      }).ok,
    ).toBe(false)
  })
})
