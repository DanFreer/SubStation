import type { PaperPreset } from '../types'

export const PAPER_PRESETS: PaperPreset[] = [
  { id: 'letter', label: 'Letter', widthIn: 8.5, heightIn: 11 },
  { id: 'legal', label: 'Legal', widthIn: 8.5, heightIn: 14 },
  { id: 'tabloid', label: 'Tabloid', widthIn: 11, heightIn: 17 },
  { id: 'a4', label: 'A4', widthIn: 8.27, heightIn: 11.69 },
  { id: 'a3', label: 'A3', widthIn: 11.69, heightIn: 16.54 },
]

export function getPaperPreset(id: string): PaperPreset | undefined {
  return PAPER_PRESETS.find((p) => p.id === id)
}
