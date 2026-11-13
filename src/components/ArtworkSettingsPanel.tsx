import { Lock, RotateCcw, Unlock } from 'lucide-react'
import type {
  ArtworkSettings,
  CropRectNorm,
  FinishedMediaPresetId,
  FitMode,
  LengthUnit,
} from '../types'
import { FINISHED_MEDIA_PRESETS } from '../utils/finishedMediaPresets'
import { CropEditor } from './CropEditor'

interface ArtworkSettingsPanelProps {
  settings: ArtworkSettings
  imageUrl: string | null
  imageWidthPx: number
  imageHeightPx: number
  onWidth: (value: number) => void
  onHeight: (value: number) => void
  onUnit: (unit: LengthUnit) => void
  onLockAspect: (lock: boolean) => void
  onFitMode: (mode: FitMode) => void
  onPreset: (id: FinishedMediaPresetId) => void
  onCropRect: (rect: CropRectNorm) => void
  onCropLockToMedia: (lock: boolean) => void
  onResetCrop: () => void
  onPortrait: () => void
  onLandscape: () => void
  onReset: () => void
}

const UNITS: LengthUnit[] = ['in', 'cm', 'mm']
const FIT_MODES: FitMode[] = ['FIT', 'FILL', 'STRETCH']

export function ArtworkSettingsPanel({
  settings,
  imageUrl,
  imageWidthPx,
  imageHeightPx,
  onWidth,
  onHeight,
  onUnit,
  onLockAspect,
  onFitMode,
  onPreset,
  onCropRect,
  onCropLockToMedia,
  onResetCrop,
  onPortrait,
  onLandscape,
  onReset,
}: ArtworkSettingsPanelProps) {
  const mediaAspect =
    settings.width > 0 && settings.height > 0
      ? settings.width / settings.height
      : 1

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
            Finished media
          </h2>
          <p className="text-[10px] text-[var(--muted)]">
            Physical product size · crop from artwork
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </header>

      <label className="block space-y-1 text-xs text-[var(--muted)]">
        Preset
        <select
          value={settings.presetId ?? 'custom'}
          onChange={(e) => onPreset(e.target.value as FinishedMediaPresetId)}
          className="block w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--text)]"
        >
          {FINISHED_MEDIA_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>

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
        Placement (crop → finished media)
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

      {imageUrl && (
        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--text)]">Artwork crop</p>
            <button
              type="button"
              onClick={onResetCrop}
              className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Reset crop
            </button>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <input
              type="checkbox"
              checked={settings.crop.lockToMediaAspect}
              onChange={(e) => onCropLockToMedia(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Lock crop aspect to finished media
          </label>
          <CropEditor
            imageUrl={imageUrl}
            imageWidthPx={imageWidthPx}
            imageHeightPx={imageHeightPx}
            crop={settings.crop.rect}
            onChange={onCropRect}
            lockToMediaAspect={settings.crop.lockToMediaAspect}
            mediaAspect={mediaAspect}
          />
        </div>
      )}
    </section>
  )
}
