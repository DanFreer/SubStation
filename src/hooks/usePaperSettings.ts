import { useCallback, useState } from 'react'
import type {
  LengthUnit,
  PaperOrientation,
  PaperPresetId,
  PaperSettings,
} from '../types'
import { getPaperPreset } from '../utils/paperPresets'
import { convertLength, fromInches, roundDisplay } from '../utils/units'

const DEFAULT: PaperSettings = {
  presetId: 'letter',
  width: 8.5,
  height: 11,
  unit: 'in',
  orientation: 'portrait',
}

function dimsForPreset(
  presetId: Exclude<PaperPresetId, 'custom'>,
  unit: LengthUnit,
  orientation: PaperOrientation,
): Pick<PaperSettings, 'width' | 'height'> {
  const preset = getPaperPreset(presetId)!
  let w = fromInches(preset.widthIn, unit)
  let h = fromInches(preset.heightIn, unit)
  if (orientation === 'landscape') {
    ;[w, h] = [h, w]
  }
  return { width: roundDisplay(w), height: roundDisplay(h) }
}

export function usePaperSettings() {
  const [settings, setSettings] = useState<PaperSettings>(DEFAULT)

  const setPreset = useCallback((presetId: PaperPresetId) => {
    setSettings((prev) => {
      if (presetId === 'custom') {
        return { ...prev, presetId }
      }
      const dims = dimsForPreset(presetId, prev.unit, prev.orientation)
      return { ...prev, presetId, ...dims }
    })
  }, [])

  const setUnit = useCallback((unit: LengthUnit) => {
    setSettings((prev) => {
      if (prev.unit === unit) return prev
      if (prev.presetId !== 'custom') {
        const dims = dimsForPreset(prev.presetId, unit, prev.orientation)
        return { ...prev, unit, ...dims }
      }
      return {
        ...prev,
        unit,
        width: roundDisplay(convertLength(prev.width, prev.unit, unit)),
        height: roundDisplay(convertLength(prev.height, prev.unit, unit)),
      }
    })
  }, [])

  const setOrientation = useCallback((orientation: PaperOrientation) => {
    setSettings((prev) => {
      if (prev.orientation === orientation) return prev
      if (prev.presetId !== 'custom') {
        const dims = dimsForPreset(prev.presetId, prev.unit, orientation)
        return { ...prev, orientation, ...dims }
      }
      return {
        ...prev,
        orientation,
        width: prev.height,
        height: prev.width,
      }
    })
  }, [])

  const setWidth = useCallback((width: number) => {
    setSettings((prev) => ({ ...prev, presetId: 'custom', width }))
  }, [])

  const setHeight = useCallback((height: number) => {
    setSettings((prev) => ({ ...prev, presetId: 'custom', height }))
  }, [])

  return {
    settings,
    setPreset,
    setUnit,
    setOrientation,
    setWidth,
    setHeight,
  }
}
