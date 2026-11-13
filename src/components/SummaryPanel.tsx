import { FileDown, Printer } from 'lucide-react'
import { useState } from 'react'
import {
  PRINT_ACTUAL_SIZE_INSTRUCTIONS,
  generatePdf,
} from '../engine/pdfGenerator'
import type { usePreviewModel } from '../hooks/usePreviewModel'
import type { PrintSettings } from '../hooks/usePrintSettings'

type PreviewModel = ReturnType<typeof usePreviewModel>

interface SummaryPanelProps {
  model: PreviewModel
  printSettings: PrintSettings
  validationBlocking?: boolean
}

const TONE_CLASS = {
  danger: 'text-red-600',
  warn: 'text-amber-600',
  info: 'text-sky-700',
  ok: 'text-emerald-700',
} as const

async function readImageBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes)
  const blob = new Blob([copy], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function SummaryPanel({
  model,
  printSettings,
  validationBlocking = false,
}: SummaryPanelProps) {
  const { artwork, paper, tileResult, resolution, mirror, overlap, margins, image } =
    model
  const layout = tileResult?.ok ? tileResult.layout : null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPrintHelp, setShowPrintHelp] = useState(false)

  const canExport = Boolean(layout && image && !validationBlocking)

  const runExport = async (mode: 'download' | 'print') => {
    if (validationBlocking) {
      setError('Fix validation issues before exporting.')
      return
    }
    if (!layout || !image) {
      setError('Upload an image and set valid sizes before exporting.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const imageBytes = await readImageBytes(image.file)
      const result = await generatePdf({
        layout,
        margins,
        mirror,
        marks: {
          cropMarks: printSettings.cropMarks,
          registrationMarks: printSettings.registrationMarks,
          tileLabels: printSettings.tileLabels,
          pageNumbers: printSettings.pageNumbers,
        },
        imageBytes,
        imageMime: image.mimeType || image.file.type || 'image/png',
        paperPresetId: paper.presetId,
      })

      if (mode === 'download') {
        downloadBytes(result.bytes, result.filename)
      } else {
        const copy = new Uint8Array(result.bytes)
        const blob = new Blob([copy], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        setShowPrintHelp(true)
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setBusy(false)
    }
  }

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

      <div className="space-y-2">
        <button
          type="button"
          disabled={!canExport || busy}
          onClick={() => void runExport('download')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          {busy ? 'Building PDF…' : 'Download PDF'}
        </button>
        <button
          type="button"
          disabled={!canExport || busy}
          onClick={() => void runExport('print')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text)] disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          Print PDF
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {!image && (
        <p className="text-xs text-[var(--muted)]">Upload an image to enable export.</p>
      )}

      {showPrintHelp && (
        <div className="rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] p-2 text-xs text-[var(--text)]">
          <p className="font-medium text-[var(--accent)]">Print at Actual Size</p>
          <p className="mt-1 text-[var(--muted)]">{PRINT_ACTUAL_SIZE_INSTRUCTIONS}</p>
          <button
            type="button"
            className="mt-2 text-[var(--accent)] underline"
            onClick={() => setShowPrintHelp(false)}
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  )
}
