import {
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  Layers,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { usePreviewModel } from '../hooks/usePreviewModel'
import { FullArtworkPreview } from './FullArtworkPreview'
import { PagePreview } from './PagePreview'

type PreviewMode = 'full' | 'page'

type PreviewModel = ReturnType<typeof usePreviewModel>

interface PreviewPanelProps {
  model: PreviewModel
}

function fitScale(
  contentW: number,
  contentH: number,
  viewW: number,
  viewH: number,
): number {
  if (contentW <= 0 || contentH <= 0 || viewW <= 0 || viewH <= 0) return 40
  return Math.max(8, Math.min(viewW / contentW, viewH / contentH) * 0.92)
}

export function PreviewPanel({ model }: PreviewPanelProps) {
  const [mode, setMode] = useState<PreviewMode>('full')
  const [pageIndex, setPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(40)

  const layout = model.tileResult?.ok ? model.tileResult.layout : null
  const pageCount = layout?.pageCount ?? 0

  useEffect(() => {
    setPageIndex((i) => (pageCount === 0 ? 0 : Math.min(i, pageCount - 1)))
  }, [pageCount])

  useEffect(() => {
    if (!layout) return
    const viewW = 640
    const viewH = 480
    if (mode === 'full') {
      setFit(fitScale(layout.artwork.width, layout.artwork.height, viewW, viewH))
    } else {
      setFit(fitScale(layout.paper.width, layout.paper.height, viewW, viewH))
    }
  }, [layout, mode, model.artW, model.artH, model.overlap, model.mirror])

  const scale = fit * zoom
  const tile = layout?.tiles[pageIndex] ?? null

  const status = useMemo(() => {
    if (model.tileResult && model.tileResult.ok === false) {
      return model.tileResult.error
    }
    return null
  }, [model.tileResult])

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <h2 className="text-sm font-semibold text-[var(--text)]">Preview</h2>
        <div className="flex rounded-md border border-[var(--border)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`rounded px-2 py-1 ${
              mode === 'full'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)]'
            }`}
          >
            Full art
          </button>
          <button
            type="button"
            onClick={() => setMode('page')}
            className={`rounded px-2 py-1 ${
              mode === 'page'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)]'
            }`}
          >
            Page
          </button>
        </div>

        {mode === 'page' && layout && (
          <div className="flex items-center gap-1 text-xs text-[var(--text)]">
            <button
              type="button"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              className="min-h-9 min-w-9 rounded border border-[var(--border)] p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[5.5rem] text-center">
              {tile?.label ?? '—'} · {pageIndex + 1}/{pageCount}
            </span>
            <button
              type="button"
              disabled={pageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((i) => Math.min(pageCount - 1, i + 1))
              }
              className="min-h-9 min-w-9 rounded border border-[var(--border)] p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {model.mirror && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
              <FlipHorizontal2 className="h-3 w-3" />
              Mirrored
            </span>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
            className="min-h-9 min-w-9 rounded border border-[var(--border)] p-1.5 text-[var(--muted)]"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="min-h-9 rounded border border-[var(--border)] px-2 py-1.5 text-[10px] text-[var(--muted)]"
            title="Fit"
          >
            <Maximize2 className="mr-1 inline h-3 w-3" />
            Fit
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
            className="min-h-9 min-w-9 rounded border border-[var(--border)] p-1.5 text-[var(--muted)]"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[var(--bg)] p-4">
        {!layout ? (
          <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
            <Layers className="h-10 w-10 opacity-40" />
            <p className="text-sm">
              {status ?? 'Set artwork and paper sizes to preview tiles'}
            </p>
          </div>
        ) : mode === 'full' ? (
          <FullArtworkPreview
            imageUrl={model.image?.objectUrl ?? null}
            layout={layout}
            mirror={model.mirror}
            scale={scale}
            highlightPageIndex={null}
          />
        ) : tile ? (
          <PagePreview
            imageUrl={model.image?.objectUrl ?? null}
            layout={layout}
            tile={tile}
            mirror={model.mirror}
            scale={scale}
            marginLeft={model.margins.left}
            marginTop={model.margins.top}
          />
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2 text-[10px] text-[var(--muted)]">
        <span>
          {model.artW.toFixed(2)}×{model.artH.toFixed(2)} in · overlap{' '}
          {model.overlap.toFixed(3)} in
          {layout
            ? ` · ${layout.pageCount} sheet${layout.pageCount === 1 ? '' : 's'} (${layout.cols}×${layout.rows}) · ${layout.orientation}`
            : ''}
        </span>
        <span>Zoom {(zoom * 100).toFixed(0)}%</span>
      </footer>
    </section>
  )
}
