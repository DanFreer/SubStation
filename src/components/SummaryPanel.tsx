import { FileDown } from 'lucide-react'
import { calculateTiles, zeroMargins } from '../engine'
import type { ArtworkSettings, PaperSettings, UploadedImage } from '../types'
import { toInches } from '../utils/units'

interface SummaryPanelProps {
  image: UploadedImage | null
  artwork: ArtworkSettings
  paper: PaperSettings
}

/** Stage 2 defaults until Stage 5 prefs / tiling controls land. */
const DEFAULT_OVERLAP_IN = 0.25

export function SummaryPanel({ image, artwork, paper }: SummaryPanelProps) {
  const artW = toInches(artwork.width, artwork.unit)
  const artH = toInches(artwork.height, artwork.unit)
  const paperW = toInches(paper.width, paper.unit)
  const paperH = toInches(paper.height, paper.unit)

  const dpi =
    image && artW > 0 && artH > 0
      ? Math.min(image.widthPx / artW, image.heightPx / artH)
      : null

  const tileResult =
    artW > 0 && artH > 0 && paperW > 0 && paperH > 0
      ? calculateTiles({
          artwork: { width: artW, height: artH },
          paper: { width: paperW, height: paperH },
          margins: zeroMargins(),
          overlap: DEFAULT_OVERLAP_IN,
          orientation: 'auto',
        })
      : null

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
          <dt className="text-[var(--muted)]">Approx. DPI</dt>
          <dd className="text-right text-[var(--text)]">
            {dpi != null ? Math.round(dpi) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Sheets</dt>
          <dd className="text-right text-[var(--text)]">
            {tileResult?.ok
              ? `${tileResult.layout.pageCount} (${tileResult.layout.cols}×${tileResult.layout.rows})`
              : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--muted)]">Printable</dt>
          <dd className="text-right text-[var(--text)]">
            {tileResult?.ok
              ? `${tileResult.layout.usable.width.toFixed(2)}×${tileResult.layout.usable.height.toFixed(2)} in`
              : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2 text-[10px] text-[var(--muted)]">
          <dt>Internal (in)</dt>
          <dd>
            art {artW.toFixed(2)}×{artH.toFixed(2)} · paper {paperW.toFixed(2)}×
            {paperH.toFixed(2)}
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
        Sheet count from Stage 2 engine (0 margins, {DEFAULT_OVERLAP_IN}&quot; overlap,
        auto orientation). Preview overlays and PDF come next.
      </p>
    </section>
  )
}
