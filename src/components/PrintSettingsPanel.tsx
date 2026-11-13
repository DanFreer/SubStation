import { FlipHorizontal2 } from 'lucide-react'
import {
  OVERLAP_PRESETS_IN,
  type PrintSettings,
} from '../hooks/usePrintSettings'
import type { LengthUnit, MarginsInches, OrientationPreference } from '../types'
import { convertLength, roundDisplay } from '../utils/units'

interface PrintSettingsPanelProps {
  settings: PrintSettings
  onUniformMargin: (value: number) => void
  onMargin: (side: keyof MarginsInches, value: number) => void
  onOverlap: (value: number) => void
  onUnit: (unit: LengthUnit) => void
  onMirror: (mirror: boolean) => void
  onOrientationPreference: (value: OrientationPreference) => void
}

const UNITS: LengthUnit[] = ['in', 'cm', 'mm']
const ORIENTATIONS: OrientationPreference[] = ['auto', 'portrait', 'landscape']
const SIDES: (keyof MarginsInches)[] = ['top', 'right', 'bottom', 'left']

export function PrintSettingsPanel({
  settings,
  onUniformMargin,
  onMargin,
  onOverlap,
  onUnit,
  onMirror,
  onOrientationPreference,
}: PrintSettingsPanelProps) {
  const uniform =
    settings.margins.top === settings.margins.right &&
    settings.margins.right === settings.margins.bottom &&
    settings.margins.bottom === settings.margins.left

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
          Print / tiling
        </h2>
      </header>

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

      <label className="block space-y-1 text-xs text-[var(--muted)]">
        Margins (all sides)
        <input
          type="number"
          min={0}
          step="any"
          value={uniform ? settings.margins.top : ''}
          placeholder={uniform ? undefined : 'mixed'}
          onChange={(e) => onUniformMargin(Number(e.target.value) || 0)}
          className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        {SIDES.map((side) => (
          <label key={side} className="space-y-1 text-xs capitalize text-[var(--muted)]">
            {side}
            <input
              type="number"
              min={0}
              step="any"
              value={settings.margins[side]}
              onChange={(e) => onMargin(side, Number(e.target.value) || 0)}
              className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
            />
          </label>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[var(--muted)]">Overlap</p>
        <div className="flex flex-wrap gap-1.5">
          {OVERLAP_PRESETS_IN.map((inches) => {
            const display = roundDisplay(
              convertLength(inches, 'in', settings.unit),
            )
            const active = Math.abs(settings.overlap - display) < 1e-6
            return (
              <button
                key={inches}
                type="button"
                onClick={() => onOverlap(display)}
                className={`rounded-md px-2 py-1 text-xs ${
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-white text-[var(--muted)] ring-1 ring-[var(--border)]'
                }`}
              >
                {inches}&quot;
              </button>
            )
          })}
        </div>
        <input
          type="number"
          min={0}
          step="any"
          value={settings.overlap}
          onChange={(e) => onOverlap(Number(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[var(--muted)]">Paper orientation</p>
        <div className="flex gap-1.5">
          {ORIENTATIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onOrientationPreference(value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs capitalize ${
                settings.orientationPreference === value
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-white text-[var(--text)]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onMirror(!settings.mirror)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
          settings.mirror
            ? 'bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]'
            : 'border border-[var(--border)] bg-white text-[var(--text)]'
        }`}
      >
        <FlipHorizontal2 className="h-4 w-4" />
        Mirror artwork {settings.mirror ? 'ON' : 'OFF'}
      </button>
      <p className="text-[10px] text-[var(--muted)]">
        Default ON. Mirrors the full finished piece before tiling; preview shows
        the mirrored state.
      </p>
    </section>
  )
}
