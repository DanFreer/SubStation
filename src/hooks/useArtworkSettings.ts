import { useCallback, useState } from 'react'
import type {
  ArtworkSettings,
  CropRectNorm,
  CropSettings,
  FinishedMediaPresetId,
  FitMode,
  LengthUnit,
} from '../types'
import { FULL_CROP } from '../types/geometry'
import { getFinishedMediaPreset } from '../utils/finishedMediaPresets'
import { convertLength, fromInches, roundDisplay } from '../utils/units'
import { normalizeCrop } from '../engine/imageProcessor'

export const DEFAULT_ARTWORK: ArtworkSettings = {
  width: 14,
  height: 17,
  unit: 'in',
  lockAspect: true,
  fitMode: 'FIT',
  presetId: '14x17',
  crop: { rect: { ...FULL_CROP }, lockToMediaAspect: false },
}

function matchPresetId(
  width: number,
  height: number,
  unit: LengthUnit,
): FinishedMediaPresetId {
  const wIn = convertLength(width, unit, 'in')
  const hIn = convertLength(height, unit, 'in')
  for (const p of [
    getFinishedMediaPreset('8x10'),
    getFinishedMediaPreset('11x14'),
    getFinishedMediaPreset('12x18'),
    getFinishedMediaPreset('13x19'),
    getFinishedMediaPreset('14x17'),
    getFinishedMediaPreset('16x20'),
  ]) {
    if (!p) continue
    if (
      (nearly(wIn, p.widthIn) && nearly(hIn, p.heightIn)) ||
      (nearly(wIn, p.heightIn) && nearly(hIn, p.widthIn))
    ) {
      return p.id
    }
  }
  return 'custom'
}

function nearly(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.02
}

function ensureCrop(settings: ArtworkSettings): ArtworkSettings {
  if (settings.crop?.rect) {
    return {
      ...settings,
      crop: {
        lockToMediaAspect: Boolean(settings.crop.lockToMediaAspect),
        rect: normalizeCrop(settings.crop.rect),
      },
      presetId: settings.presetId ?? matchPresetId(settings.width, settings.height, settings.unit),
    }
  }
  return {
    ...settings,
    crop: { rect: { ...FULL_CROP }, lockToMediaAspect: false },
    presetId: settings.presetId ?? matchPresetId(settings.width, settings.height, settings.unit),
  }
}

export function useArtworkSettings(
  pixelAspect?: number | null,
  initial?: ArtworkSettings | null,
) {
  const [settings, setSettings] = useState<ArtworkSettings>(() =>
    ensureCrop(initial ?? DEFAULT_ARTWORK),
  )

  const aspect =
    pixelAspect && pixelAspect > 0
      ? pixelAspect
      : settings.width > 0 && settings.height > 0
        ? settings.width / settings.height
        : 1

  const mediaAspect =
    settings.width > 0 && settings.height > 0
      ? settings.width / settings.height
      : 1

  const setWidth = useCallback(
    (width: number) => {
      setSettings((prev) => {
        const next = { ...prev, width, presetId: 'custom' as FinishedMediaPresetId }
        if (prev.lockAspect && width > 0) {
          next.height = roundDisplay(width / aspect)
        }
        next.presetId = matchPresetId(next.width, next.height, next.unit)
        return next
      })
    },
    [aspect],
  )

  const setHeight = useCallback(
    (height: number) => {
      setSettings((prev) => {
        const next = { ...prev, height, presetId: 'custom' as FinishedMediaPresetId }
        if (prev.lockAspect && height > 0) {
          next.width = roundDisplay(height * aspect)
        }
        next.presetId = matchPresetId(next.width, next.height, next.unit)
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

  const setPreset = useCallback((presetId: FinishedMediaPresetId) => {
    setSettings((prev) => {
      if (presetId === 'custom') {
        return { ...prev, presetId }
      }
      const preset = getFinishedMediaPreset(presetId)
      if (!preset) return { ...prev, presetId: 'custom' }
      const width = roundDisplay(fromInches(preset.widthIn, prev.unit))
      const height = roundDisplay(fromInches(preset.heightIn, prev.unit))
      return { ...prev, presetId, width, height }
    })
  }, [])

  const setCropRect = useCallback(
    (rect: CropRectNorm) => {
      setSettings((prev) => {
        let next = normalizeCrop(rect)
        if (prev.crop.lockToMediaAspect && mediaAspect > 0) {
          next = lockCropToAspect(next, mediaAspect)
        }
        return {
          ...prev,
          crop: { ...prev.crop, rect: next },
        }
      })
    },
    [mediaAspect],
  )

  const setCropLockToMedia = useCallback(
    (lockToMediaAspect: boolean) => {
      setSettings((prev) => {
        let rect = prev.crop.rect
        if (lockToMediaAspect && mediaAspect > 0) {
          rect = lockCropToAspect(rect, mediaAspect)
        }
        return {
          ...prev,
          crop: { lockToMediaAspect, rect },
        }
      })
    },
    [mediaAspect],
  )

  const resetCrop = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      crop: {
        ...prev.crop,
        rect: { ...FULL_CROP },
      },
    }))
  }, [])

  const applyPortrait = useCallback(() => {
    setSettings((prev) => {
      const w = Math.min(prev.width, prev.height)
      const h = Math.max(prev.width, prev.height)
      return {
        ...prev,
        width: w,
        height: h,
        presetId: matchPresetId(w, h, prev.unit),
      }
    })
  }, [])

  const applyLandscape = useCallback(() => {
    setSettings((prev) => {
      const w = Math.max(prev.width, prev.height)
      const h = Math.min(prev.width, prev.height)
      return {
        ...prev,
        width: w,
        height: h,
        presetId: matchPresetId(w, h, prev.unit),
      }
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
    setPreset,
    setCropRect,
    setCropLockToMedia,
    resetCrop,
    applyPortrait,
    applyLandscape,
    reset,
  }
}

/** Shrink/expand crop around its center to match target aspect (W/H). */
export function lockCropToAspect(
  crop: CropRectNorm,
  mediaAspect: number,
): CropRectNorm {
  const c = normalizeCrop(crop)
  if (mediaAspect <= 0) return c
  const cropAspect = c.width / c.height
  let { x, y, width, height } = c
  if (cropAspect > mediaAspect) {
    // Too wide — reduce width
    width = height * mediaAspect
    x = c.x + (c.width - width) / 2
  } else {
    height = width / mediaAspect
    y = c.y + (c.height - height) / 2
  }
  return normalizeCrop({ x, y, width, height })
}

export type { CropSettings }
