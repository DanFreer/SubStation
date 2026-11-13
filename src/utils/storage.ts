import type { ArtworkSettings, PaperSettings } from '../types'
import { FULL_CROP } from '../types/geometry'
import type { PrintSettings } from '../hooks/usePrintSettings'
import { normalizeCrop } from '../engine/imageProcessor'

export const PREFS_STORAGE_KEY = 'substation.prefs.v1'

export interface StoredPreferences {
  artwork: ArtworkSettings
  paper: PaperSettings
  print: PrintSettings
  /** Schema version for future migrations. */
  version: 1
}

function migrateArtwork(raw: unknown): ArtworkSettings | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const a = raw as Partial<ArtworkSettings>
  if (
    typeof a.width !== 'number' ||
    typeof a.height !== 'number' ||
    !a.unit ||
    !a.fitMode
  ) {
    return undefined
  }
  return {
    width: a.width,
    height: a.height,
    unit: a.unit,
    lockAspect: Boolean(a.lockAspect),
    fitMode: a.fitMode,
    presetId: a.presetId ?? 'custom',
    crop: {
      lockToMediaAspect: Boolean(a.crop?.lockToMediaAspect),
      rect: normalizeCrop(a.crop?.rect ?? FULL_CROP),
    },
  }
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
    const artwork = migrateArtwork(obj.artwork)
    return {
      version: 1,
      artwork,
      paper: obj.paper as PaperSettings | undefined,
      print: obj.print as PrintSettings | undefined,
    }
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
      artwork: {
        ...prefs.artwork,
        crop: {
          lockToMediaAspect: prefs.artwork.crop.lockToMediaAspect,
          rect: normalizeCrop(prefs.artwork.crop.rect),
        },
      },
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
