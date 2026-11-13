import type { CropRectNorm as CropRectNormType } from './geometry'

export type {
  CropRectNorm,
  MarginsInches,
  OrientationPreference,
  SeamOverrides,
  SizeInches,
  TileCalculationInput,
  TileCalculationResult,
  TileLayout,
  TileRect,
  UsableArea,
} from './geometry'
export type { PaperOrientation as GeometryPaperOrientation } from './geometry'
export { FULL_CROP } from './geometry'

type CropRectNorm = CropRectNormType

export type LengthUnit = 'in' | 'cm' | 'mm'

export type FitMode = 'FIT' | 'FILL' | 'STRETCH'

export type PaperOrientation = 'portrait' | 'landscape'

export type PaperPresetId =
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'a4'
  | 'a3'
  | 'custom'

export type FinishedMediaPresetId =
  | '8x10'
  | '11x14'
  | '12x18'
  | '13x19'
  | '14x17'
  | '16x20'
  | 'custom'

export interface UploadedImage {
  file: File
  objectUrl: string
  widthPx: number
  heightPx: number
  name: string
  mimeType: string
}

/** Normalized crop on the uploaded artwork (pixels). */
export interface CropSettings {
  rect: CropRectNorm
  /** Lock crop aspect ratio to finished-media W/H. */
  lockToMediaAspect: boolean
}

export interface ArtworkSettings {
  width: number
  height: number
  unit: LengthUnit
  lockAspect: boolean
  fitMode: FitMode
  /** Optional finished-media preset id for UI. */
  presetId?: FinishedMediaPresetId
  crop: CropSettings
}

export interface FinishedMediaPreset {
  id: Exclude<FinishedMediaPresetId, 'custom'>
  label: string
  widthIn: number
  heightIn: number
}

export interface PaperSettings {
  presetId: PaperPresetId
  width: number
  height: number
  unit: LengthUnit
  orientation: PaperOrientation
}

export interface PaperPreset {
  id: Exclude<PaperPresetId, 'custom'>
  label: string
  widthIn: number
  heightIn: number
}
