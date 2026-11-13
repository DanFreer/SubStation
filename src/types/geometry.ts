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
 * Normalized crop rectangle on the source image (fractions of pixel W/H).
 * Default full image: { x:0, y:0, width:1, height:1 }.
 */
export interface CropRectNorm {
  x: number
  y: number
  width: number
  height: number
}

export const FULL_CROP: CropRectNorm = { x: 0, y: 0, width: 1, height: 1 }

/**
 * Optional seam center positions in finished-artwork inches.
 * Overlap is always centered on each seam. Length of each array is
 * tileCount − 1 along that axis.
 */
export interface SeamOverrides {
  vertical?: number[]
  horizontal?: number[]
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
  /** N×usable − (N−1)×overlap along each axis (auto coverage metric). */
  coverage: SizeInches
  /** Printable area reserved minus artwork area (tie-break metric). */
  unusedPrintableArea: number
  /** Seam centers (artwork inches); overlap is centered on these. */
  verticalSeams: number[]
  horizontalSeams: number[]
  tiles: TileRect[]
}

export interface TileCalculationInput {
  artwork: SizeInches
  /** Paper / transfer-material size in the caller’s current orientation (inches). */
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
   * Mirror does not change finished W×H, so tiling ignores this flag;
   * accepted for forward API shape / PDF pipeline.
   */
  mirror?: boolean
  /**
   * Optional seam center overrides (artwork inches). When omitted or invalid,
   * seams are derived from uniform step = usable − overlap.
   */
  seams?: SeamOverrides
  /**
   * Minimum non-overlap tile extent along an axis (inches).
   * Default 0.5. Used when clamping dragged seams.
   */
  minTileSize?: number
}

export type TileCalculationResult =
  | { ok: true; layout: TileLayout }
  | { ok: false; error: string }
