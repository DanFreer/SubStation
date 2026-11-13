import { useCallback, useState } from 'react'
import type { LengthUnit, MarginsInches, OrientationPreference } from '../types'
import { convertLength, roundDisplay } from '../utils/units'

export const OVERLAP_PRESETS_IN = [0, 0.125, 0.25, 0.375, 0.5] as const

export interface PrintSettings {
  /** Margins in the active `unit` (converted to inches at the engine edge). */
  margins: MarginsInches
  /** Overlap in the active `unit`. */
  overlap: number
  unit: LengthUnit
  mirror: boolean
  orientationPreference: OrientationPreference
  cropMarks: boolean
  registrationMarks: boolean
  tileLabels: boolean
  pageNumbers: boolean
}

const DEFAULT: PrintSettings = {
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

function convertMargins(
  margins: MarginsInches,
  from: LengthUnit,
  to: LengthUnit,
): MarginsInches {
  return {
    top: roundDisplay(convertLength(margins.top, from, to)),
    right: roundDisplay(convertLength(margins.right, from, to)),
    bottom: roundDisplay(convertLength(margins.bottom, from, to)),
    left: roundDisplay(convertLength(margins.left, from, to)),
  }
}

export function usePrintSettings() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT)

  const setUniformMargin = useCallback((value: number) => {
    setSettings((prev) => ({
      ...prev,
      margins: { top: value, right: value, bottom: value, left: value },
    }))
  }, [])

  const setMargin = useCallback((side: keyof MarginsInches, value: number) => {
    setSettings((prev) => ({
      ...prev,
      margins: { ...prev.margins, [side]: value },
    }))
  }, [])

  const setOverlap = useCallback((overlap: number) => {
    setSettings((prev) => ({ ...prev, overlap }))
  }, [])

  const setUnit = useCallback((unit: LengthUnit) => {
    setSettings((prev) => {
      if (prev.unit === unit) return prev
      return {
        ...prev,
        unit,
        margins: convertMargins(prev.margins, prev.unit, unit),
        overlap: roundDisplay(convertLength(prev.overlap, prev.unit, unit)),
      }
    })
  }, [])

  const setMirror = useCallback((mirror: boolean) => {
    setSettings((prev) => ({ ...prev, mirror }))
  }, [])

  const setOrientationPreference = useCallback(
    (orientationPreference: OrientationPreference) => {
      setSettings((prev) => ({ ...prev, orientationPreference }))
    },
    [],
  )

  const setMark = useCallback(
    (
      key: 'cropMarks' | 'registrationMarks' | 'tileLabels' | 'pageNumbers',
      value: boolean,
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  return {
    settings,
    setUniformMargin,
    setMargin,
    setOverlap,
    setUnit,
    setMirror,
    setOrientationPreference,
    setMark,
  }
}
