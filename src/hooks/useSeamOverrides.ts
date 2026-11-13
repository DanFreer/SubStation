import { useCallback, useState } from 'react'
import {
  DEFAULT_MIN_TILE_SIZE,
  autoSeamCenters,
  clampSeamCenters,
} from '../engine/tileCalculator'
import type { SeamOverrides, TileLayout } from '../types'

export const SEAM_NUDGE_IN = 0.125

/**
 * Manual seam overrides for the tile engine.
 * Pass the latest layout into mutators for clamping; clear when the grid
 * size no longer matches (call `pruneAgainstLayout` from the shell).
 */
export function useSeamOverrides() {
  const [overrides, setOverrides] = useState<SeamOverrides | null>(null)

  const pruneAgainstLayout = useCallback((layout: TileLayout | null) => {
    if (!layout) {
      setOverrides(null)
      return
    }
    setOverrides((prev) => {
      if (!prev) return prev
      const vOk =
        !prev.vertical || prev.vertical.length === layout.cols - 1
      const hOk =
        !prev.horizontal || prev.horizontal.length === layout.rows - 1
      if (vOk && hOk) return prev
      return null
    })
  }, [])

  const setVerticalSeam = useCallback(
    (layout: TileLayout, index: number, positionIn: number) => {
      setOverrides((prev) => {
        const base =
          prev?.vertical && prev.vertical.length === layout.cols - 1
            ? [...prev.vertical]
            : [...layout.verticalSeams]
        if (index < 0 || index >= base.length) return prev
        base[index] = positionIn
        const vertical = clampSeamCenters(
          base,
          layout.artwork.width,
          layout.overlap,
          DEFAULT_MIN_TILE_SIZE,
          layout.usable.width,
        )
        return {
          vertical,
          horizontal: prev?.horizontal ?? layout.horizontalSeams,
        }
      })
    },
    [],
  )

  const setHorizontalSeam = useCallback(
    (layout: TileLayout, index: number, positionIn: number) => {
      setOverrides((prev) => {
        const base =
          prev?.horizontal && prev.horizontal.length === layout.rows - 1
            ? [...prev.horizontal]
            : [...layout.horizontalSeams]
        if (index < 0 || index >= base.length) return prev
        base[index] = positionIn
        const horizontal = clampSeamCenters(
          base,
          layout.artwork.height,
          layout.overlap,
          DEFAULT_MIN_TILE_SIZE,
          layout.usable.height,
        )
        return {
          horizontal,
          vertical: prev?.vertical ?? layout.verticalSeams,
        }
      })
    },
    [],
  )

  const nudgeVertical = useCallback(
    (layout: TileLayout, index: number, dir: 1 | -1) => {
      const current =
        overrides?.vertical?.[index] ?? layout.verticalSeams[index]
      if (current === undefined) return
      setVerticalSeam(layout, index, current + dir * SEAM_NUDGE_IN)
    },
    [overrides, setVerticalSeam],
  )

  const nudgeHorizontal = useCallback(
    (layout: TileLayout, index: number, dir: 1 | -1) => {
      const current =
        overrides?.horizontal?.[index] ?? layout.horizontalSeams[index]
      if (current === undefined) return
      setHorizontalSeam(layout, index, current + dir * SEAM_NUDGE_IN)
    },
    [overrides, setHorizontalSeam],
  )

  const resetSeams = useCallback(() => {
    setOverrides(null)
  }, [])

  const snapToAuto = useCallback((layout: TileLayout) => {
    setOverrides({
      vertical: autoSeamCenters(
        layout.cols,
        layout.usable.width,
        layout.overlap,
      ),
      horizontal: autoSeamCenters(
        layout.rows,
        layout.usable.height,
        layout.overlap,
      ),
    })
  }, [])

  return {
    overrides,
    hasOverrides: overrides !== null,
    setVerticalSeam,
    setHorizontalSeam,
    nudgeVertical,
    nudgeHorizontal,
    resetSeams,
    snapToAuto,
    pruneAgainstLayout,
    nudgeStep: SEAM_NUDGE_IN,
  }
}
