import type { FinishedMediaPreset } from '../types'

/** Common sublimation / product finished sizes (inches). */
export const FINISHED_MEDIA_PRESETS: FinishedMediaPreset[] = [
  { id: '8x10', label: '8×10', widthIn: 8, heightIn: 10 },
  { id: '11x14', label: '11×14', widthIn: 11, heightIn: 14 },
  { id: '12x18', label: '12×18', widthIn: 12, heightIn: 18 },
  { id: '13x19', label: '13×19', widthIn: 13, heightIn: 19 },
  { id: '14x17', label: '14×17', widthIn: 14, heightIn: 17 },
  { id: '16x20', label: '16×20', widthIn: 16, heightIn: 20 },
]

export function getFinishedMediaPreset(
  id: string,
): FinishedMediaPreset | undefined {
  return FINISHED_MEDIA_PRESETS.find((p) => p.id === id)
}
