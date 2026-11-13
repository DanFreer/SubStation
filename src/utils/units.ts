import type { LengthUnit } from '../types'

const INCH_TO_CM = 2.54
const INCH_TO_MM = 25.4

/** Convert a length into inches (engine internal unit). */
export function toInches(value: number, unit: LengthUnit): number {
  switch (unit) {
    case 'in':
      return value
    case 'cm':
      return value / INCH_TO_CM
    case 'mm':
      return value / INCH_TO_MM
  }
}

/** Convert inches into the display unit. */
export function fromInches(inches: number, unit: LengthUnit): number {
  switch (unit) {
    case 'in':
      return inches
    case 'cm':
      return inches * INCH_TO_CM
    case 'mm':
      return inches * INCH_TO_MM
  }
}

/** Convert a value from one unit to another. */
export function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit,
): number {
  if (from === to) return value
  return fromInches(toInches(value, from), to)
}

export function roundDisplay(value: number, digits = 3): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
