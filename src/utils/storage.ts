import type { ArtworkSettings, PaperSettings } from '../types'
import type { PrintSettings } from '../hooks/usePrintSettings'

export const PREFS_STORAGE_KEY = 'substation.prefs.v1'

export interface StoredPreferences {
  artwork: ArtworkSettings
  paper: PaperSettings
  print: PrintSettings
  /** Schema version for future migrations. */
  version: 1
}

/** Never persist uploaded images — only settings. */
export function loadPreferences(): Partial<StoredPreferences> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    if (obj.version !== 1) return null
    return obj as Partial<StoredPreferences>
  } catch {
    return null
  }
}

export function savePreferences(prefs: StoredPreferences): void {
  if (typeof localStorage === 'undefined') return
  try {
    // Explicit omit of any image fields if somehow present
    const safe: StoredPreferences = {
      version: 1,
      artwork: prefs.artwork,
      paper: prefs.paper,
      print: prefs.print,
    }
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(safe))
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearPreferences(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(PREFS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
