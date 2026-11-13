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

export interface UploadedImage {
  file: File
  objectUrl: string
  widthPx: number
  heightPx: number
  name: string
  mimeType: string
}

export interface ArtworkSettings {
  width: number
  height: number
  unit: LengthUnit
  lockAspect: boolean
  fitMode: FitMode
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
