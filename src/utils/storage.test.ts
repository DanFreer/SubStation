import { afterEach, describe, expect, it } from 'vitest'
import {
  PREFS_STORAGE_KEY,
  clearPreferences,
  loadPreferences,
  savePreferences,
} from './storage'

const memory = new Map<string, string>()

afterEach(() => {
  memory.clear()
})

describe('preferences storage', () => {
  it('round-trips settings without image data', () => {
    const store = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v)
      },
      removeItem: (k: string) => {
        memory.delete(k)
      },
    }
    Object.defineProperty(globalThis, 'localStorage', {
      value: store,
      configurable: true,
    })

    savePreferences({
      version: 1,
      artwork: {
        width: 14,
        height: 17,
        unit: 'in',
        lockAspect: true,
        fitMode: 'FIT',
        presetId: '14x17',
        crop: {
          rect: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          lockToMediaAspect: false,
        },
      },
      paper: {
        presetId: 'letter',
        width: 8.5,
        height: 11,
        unit: 'in',
        orientation: 'portrait',
      },
      print: {
        margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
        overlap: 0.25,
        unit: 'in',
        mirror: true,
        orientationPreference: 'auto',
        cropMarks: true,
        registrationMarks: false,
        tileLabels: true,
        pageNumbers: true,
      },
    })

    const raw = memory.get(PREFS_STORAGE_KEY)!
    expect(raw).not.toMatch(/objectUrl|image\/|File|blob:/i)

    const loaded = loadPreferences()
    expect(loaded?.artwork?.width).toBe(14)
    expect(loaded?.artwork?.crop?.rect.width).toBe(0.8)
    expect(loaded?.print?.mirror).toBe(true)
    expect(loaded?.print?.registrationMarks).toBe(false)

    clearPreferences()
    expect(loadPreferences()).toBeNull()
  })
})
