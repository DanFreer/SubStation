import { FileDown } from 'lucide-react'
import type { usePreviewModel } from '../hooks/usePreviewModel'

type PreviewModel = ReturnType<typeof usePreviewModel>

interface SummaryPanelProps {
  model: PreviewModel
}

const TONE_CLASS = {
  danger: 'text-red-600',
  warn: 'text-amber-600',
  info: 'text-sky-700',
  ok: 'text-emerald-700',
} as const

export function SummaryPanel({ model }: SummaryPanelProps) {
  const { artwork, paper, tileResult, resolution, mirror, overlap, margins } =
    model
  const layout = tileResult?.ok ? tileResult.layout : null

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
          Summary
        </h2>
      </header>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Artwork</dt>
          <dd className="text-right text-[var(--text)]">
            {artwork.width} × {artwork.height} {artwork.unit}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Paper</dt>
          <dd className="text-right capitalize text-[var(--text)]">
            {paper.presetId} · {paper.orientation}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Paper size</dt>
          <dd className="text-right text-[var(--text)]">
            {paper.width} × {paper.height} {paper.unit}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Mirror</dt>
          <dd className="text-right text-[var(--text)]">{mirror ? 'ON' : 'OFF'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Overlap</dt>
          <dd className="text-right text-[var(--text)]">
            {overlap.toFixed(3)} in
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Margins</dt>
          <dd className="text-right text-[var(--text)]">
            {margins.top.toFixed(2)}/{margins.right.toFixed(2)}/
            {margins.bottom.toFixed(2)}/{margins.left.toFixed(2)} in
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Effective DPI</dt>
          <dd className="text-right text-[var(--text)]">
            {resolution?.ok ? Math.round(resolution.result.dpi) : '—'}
          </dd>
        </div>
        {resolution?.ok && (
          <div className="rounded-md bg-[var(--bg)] px-2 py-1.5">
            <p className={`font-medium ${TONE_CLASS[resolution.result.band.tone]}`}>
              {resolution.result.band.label}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--muted)]">
              {resolution.result.band.message}
            </p>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Sheets</dt>
          <dd className="text-right text-[var(--text)]">
            {layout
              ? `${layout.pageCount} (${layout.cols}×${layout.rows}) · ${layout.orientation}`
              : tileResult && tileResult.ok === false
                ? 'Error'
                : '—'}
          </dd>
        </div>
        {tileResult && tileResult.ok === false && (
          <p className="text-[10px] text-red-600">{tileResult.error}</p>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Printable</dt>
          <dd className="text-right text-[var(--text)]">
            {layout
              ? `${layout.usable.width.toFixed(2)}×${layout.usable.height.toFixed(2)} in`
              : '—'}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        disabled
        title="PDF export arrives in Stage 4"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white opacity-50"
      >
        <FileDown className="h-4 w-4" />
        Download PDF
      </button>
      <p className="text-xs text-[var(--muted)]">
        Geometry from Stage 2 engine; preview mirrors before tiling. PDF in
        Stage 4.
      </p>
    </section>
  )
}
