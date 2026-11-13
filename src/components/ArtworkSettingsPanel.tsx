import { Lock, RotateCcw, Unlock } from 'lucide-react'
import type { ArtworkSettings, FitMode, LengthUnit } from '../types'

interface ArtworkSettingsPanelProps {
  settings: ArtworkSettings
  onWidth: (value: number) => void
  onHeight: (value: number) => void
  onUnit: (unit: LengthUnit) => void
  onLockAspect: (lock: boolean) => void
  onFitMode: (mode: FitMode) => void
  onPortrait: () => void
  onLandscape: () => void
  onReset: () => void
}

const UNITS: LengthUnit[] = ['in', 'cm', 'mm']
const FIT_MODES: FitMode[] = ['FIT', 'FILL', 'STRETCH']

export function ArtworkSettingsPanel({
  settings,
  onWidth,
  onHeight,
  onUnit,
  onLockAspect,
  onFitMode,
  onPortrait,
  onLandscape,
  onReset,
}: ArtworkSettingsPanelProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
          Artwork size
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="space-y-1 text-xs text-[var(--muted)]">
          Width
          <input
            type="number"
            min={0}
            step="any"
            value={settings.width}
            onChange={(e) => onWidth(Number(e.target.value) || 0)}
            className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
          />
        </label>
        <button
          type="button"
          title={settings.lockAspect ? 'Unlock aspect' : 'Lock aspect'}
          onClick={() => onLockAspect(!settings.lockAspect)}
          className="mb-0.5 rounded-md border border-[var(--border)] bg-white p-2 text-[var(--muted)] hover:text-[var(--accent)]"
        >
          {settings.lockAspect ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </button>
        <label className="space-y-1 text-xs text-[var(--muted)]">
          Height
          <input
            type="number"
            min={0}
            step="any"
            value={settings.height}
            onChange={(e) => onHeight(Number(e.target.value) || 0)}
            className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {UNITS.map((unit) => (
          <button
            key={unit}
            type="button"
            onClick={() => onUnit(unit)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              settings.unit === unit
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white text-[var(--muted)] ring-1 ring-[var(--border)]'
            }`}
          >
            {unit}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPortrait}
          className="flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--bg)]"
        >
          Portrait
        </button>
        <button
          type="button"
          onClick={onLandscape}
          className="flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--bg)]"
        >
          Landscape
        </button>
      </div>

      <label className="block space-y-1 text-xs text-[var(--muted)]">
        Placement (Stage 3)
        <select
          value={settings.fitMode}
          onChange={(e) => onFitMode(e.target.value as FitMode)}
          className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
        >
          {FIT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
