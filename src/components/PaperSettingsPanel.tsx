import type { LengthUnit, PaperOrientation, PaperPresetId, PaperSettings } from '../types'
import { PAPER_PRESETS } from '../utils/paperPresets'

interface PaperSettingsPanelProps {
  settings: PaperSettings
  onPreset: (id: PaperPresetId) => void
  onUnit: (unit: LengthUnit) => void
  onOrientation: (orientation: PaperOrientation) => void
  onWidth: (value: number) => void
  onHeight: (value: number) => void
}

const UNITS: LengthUnit[] = ['in', 'cm', 'mm']

export function PaperSettingsPanel({
  settings,
  onPreset,
  onUnit,
  onOrientation,
  onWidth,
  onHeight,
}: PaperSettingsPanelProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
          Transfer material
        </h2>
        <p className="text-[10px] text-[var(--muted)]">
          Printable sheet size (Letter / A4 / custom)
        </p>
      </header>

      <label className="block space-y-1 text-xs text-[var(--muted)]">
        Preset
        <select
          value={settings.presetId}
          onChange={(e) => onPreset(e.target.value as PaperPresetId)}
          className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
        >
          {PAPER_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
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
        {(['portrait', 'landscape'] as PaperOrientation[]).map((orientation) => (
          <button
            key={orientation}
            type="button"
            onClick={() => onOrientation(orientation)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs capitalize ${
              settings.orientation === orientation
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-white text-[var(--text)]'
            }`}
          >
            {orientation}
          </button>
        ))}
      </div>
    </section>
  )
}
