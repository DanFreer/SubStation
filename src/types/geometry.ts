/** All engine geometry uses inches unless noted. */

export interface SizeInches {
  width: number
  height: number
}

export interface MarginsInches {
  top: number
  right: number
  bottom: number
  left: number
}

export type PaperOrientation = 'portrait' | 'landscape'

/** How the engine may reorient paper when computing tiles. */
export type OrientationPreference = 'portrait' | 'landscape' | 'auto'

export interface UsableArea {
  width: number
  height: number
  paper: SizeInches
  margins: MarginsInches
}

/**
 * One tile / sheet. Artwork coords are in finished-artwork space
 * (origin at top-left of the finished piece, before PDF placement).
 */
export interface TileRect {
  col: number
  row: number
  /** 0-based, row-major (left→right, top→bottom). */
  pageIndex: number
  label: string
  artX: number
  artY: number
  artWidth: number
  artHeight: number
  /** Offset within the usable printable area (inches). */
  pageX: number
  pageY: number
}

export interface TileLayout {
  cols: number
  rows: number
  pageCount: number
  orientation: PaperOrientation
  overlap: number
  paper: SizeInches
  usable: SizeInches
  artwork: SizeInches
  /** N×usable − (N−1)×overlap along each axis. */
  coverage: SizeInches
  /** Printable area reserved minus artwork area (tie-break metric). */
  unusedPrintableArea: number
  tiles: TileRect[]
}

export interface TileCalculationInput {
  artwork: SizeInches
  /** Paper size in the caller’s current orientation (inches). */
  paper: SizeInches
  margins: MarginsInches
  /** Overlap in inches (≥ 0). Default in UI is 0.25. */
  overlap: number
  /**
   * `auto` evaluates both paper orientations and picks lowest page count,
   * then least unused printable area.
   */
  orientation: OrientationPreference
  /**
   * Stage 3 will mirror artwork pixels before tiling. Mirror does not change
   * finished W×H, so tiling ignores this flag; accepted for forward API shape.
   */
  mirror?: boolean
}

export type TileCalculationResult =
  | { ok: true; layout: TileLayout }
  | { ok: false; error: string }
