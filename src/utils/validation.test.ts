import { describe, expect, it } from 'vitest'
import { validateAll, validateArtwork, validatePrint } from './validation'
import type { PrintSettings } from '../hooks/usePrintSettings'

const basePrint: PrintSettings = {
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
  overlap: 0.25,
  unit: 'in',
  mirror: true,
  orientationPreference: 'auto',
  cropMarks: true,
  registrationMarks: true,
  tileLabels: true,
  pageNumbers: true,
}

describe('validation', () => {
  it('rejects non-positive artwork dims', () => {
    const issues = validateArtwork({
      width: 0,
      height: 10,
      unit: 'in',
      lockAspect: true,
      fitMode: 'FIT',
    })
    expect(issues.some((i) => i.field === 'artwork.width')).toBe(true)
  })

  it('rejects margins that consume the sheet', () => {
    const issues = validatePrint(
      {
        ...basePrint,
        margins: { top: 6, right: 0, bottom: 6, left: 0 },
      },
      {
        presetId: 'letter',
        width: 8.5,
        height: 11,
        unit: 'in',
        orientation: 'portrait',
      },
    )
    expect(issues.some((i) => i.field === 'margins')).toBe(true)
  })

  it('passes a happy-path matrix of paper + art', () => {
    const issues = validateAll({
      artwork: {
        width: 14,
        height: 17,
        unit: 'in',
        lockAspect: true,
        fitMode: 'FIT',
      },
      paper: {
        presetId: 'letter',
        width: 8.5,
        height: 11,
        unit: 'in',
        orientation: 'portrait',
      },
      print: basePrint,
    })
    expect(issues).toEqual([])
  })
})
