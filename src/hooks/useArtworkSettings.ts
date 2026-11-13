import { useCallback, useState } from 'react'
import type { ArtworkSettings, FitMode, LengthUnit } from '../types'
import { convertLength, roundDisplay } from '../utils/units'

export const DEFAULT_ARTWORK: ArtworkSettings = {
  width: 14,
  height: 17,
  unit: 'in',
  lockAspect: true,
  fitMode: 'FIT',
}

export function useArtworkSettings(
  pixelAspect?: number | null,
  initial?: ArtworkSettings | null,
) {
  const [settings, setSettings] = useState<ArtworkSettings>(
    initial ?? DEFAULT_ARTWORK,
  )

  const aspect =
    pixelAspect && pixelAspect > 0
      ? pixelAspect
      : settings.width > 0 && settings.height > 0
        ? settings.width / settings.height
        : 1

  const setWidth = useCallback(
    (width: number) => {
      setSettings((prev) => {
        const next = { ...prev, width }
        if (prev.lockAspect && width > 0) {
          next.height = roundDisplay(width / aspect)
        }
        return next
      })
    },
    [aspect],
  )

  const setHeight = useCallback(
    (height: number) => {
      setSettings((prev) => {
        const next = { ...prev, height }
        if (prev.lockAspect && height > 0) {
          next.width = roundDisplay(height * aspect)
        }
        return next
      })
    },
    [aspect],
  )

  const setUnit = useCallback((unit: LengthUnit) => {
    setSettings((prev) => {
      if (prev.unit === unit) return prev
      return {
        ...prev,
        unit,
        width: roundDisplay(convertLength(prev.width, prev.unit, unit)),
        height: roundDisplay(convertLength(prev.height, prev.unit, unit)),
      }
    })
  }, [])

  const setLockAspect = useCallback((lockAspect: boolean) => {
    setSettings((prev) => ({ ...prev, lockAspect }))
  }, [])

  const setFitMode = useCallback((fitMode: FitMode) => {
    setSettings((prev) => ({ ...prev, fitMode }))
  }, [])

  const applyPortrait = useCallback(() => {
    setSettings((prev) => {
      const w = Math.min(prev.width, prev.height)
      const h = Math.max(prev.width, prev.height)
      return { ...prev, width: w, height: h }
    })
  }, [])

  const applyLandscape = useCallback(() => {
    setSettings((prev) => {
      const w = Math.max(prev.width, prev.height)
      const h = Math.min(prev.width, prev.height)
      return { ...prev, width: w, height: h }
    })
  }, [])

  const reset = useCallback(() => {
    setSettings(DEFAULT_ARTWORK)
  }, [])

  return {
    settings,
    setWidth,
    setHeight,
    setUnit,
    setLockAspect,
    setFitMode,
    applyPortrait,
    applyLandscape,
    reset,
  }
}
