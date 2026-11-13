import { describe, expect, it } from 'vitest'
import { convertLength, fromInches, toInches } from './units'

describe('units', () => {
  it('converts inches to cm and back', () => {
    expect(toInches(2.54, 'cm')).toBeCloseTo(1, 6)
    expect(fromInches(1, 'cm')).toBeCloseTo(2.54, 6)
    expect(convertLength(1, 'in', 'mm')).toBeCloseTo(25.4, 6)
  })
})
