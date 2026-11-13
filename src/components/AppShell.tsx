import { useArtworkSettings } from '../hooks/useArtworkSettings'
import { useImageUpload } from '../hooks/useImageUpload'
import { usePaperSettings } from '../hooks/usePaperSettings'
import { ArtworkSettingsPanel } from './ArtworkSettingsPanel'
import { ImageUpload } from './ImageUpload'
import { PaperSettingsPanel } from './PaperSettingsPanel'
import { PreviewPanel } from './PreviewPanel'
import { SummaryPanel } from './SummaryPanel'

export function AppShell() {
  const { image, error, loadFile, clear } = useImageUpload()
  const pixelAspect =
    image && image.heightPx > 0 ? image.widthPx / image.heightPx : null
  const artwork = useArtworkSettings(pixelAspect)
  const paper = usePaperSettings()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Sublimation Print Studio
          </p>
          <h1 className="text-lg font-semibold text-[var(--text)]">SubStation</h1>
        </div>
        <p className="hidden text-xs text-[var(--muted)] sm:block">
          Stage 1 · foundation
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <ImageUpload
            image={image}
            error={error}
            onFile={loadFile}
            onClear={clear}
          />
          <ArtworkSettingsPanel
            settings={artwork.settings}
            onWidth={artwork.setWidth}
            onHeight={artwork.setHeight}
            onUnit={artwork.setUnit}
            onLockAspect={artwork.setLockAspect}
            onFitMode={artwork.setFitMode}
            onPortrait={artwork.applyPortrait}
            onLandscape={artwork.applyLandscape}
            onReset={artwork.reset}
          />
          <PaperSettingsPanel
            settings={paper.settings}
            onPreset={paper.setPreset}
            onUnit={paper.setUnit}
            onOrientation={paper.setOrientation}
            onWidth={paper.setWidth}
            onHeight={paper.setHeight}
          />
        </aside>

        <main className="min-h-[320px] min-w-0">
          <PreviewPanel image={image} artwork={artwork.settings} />
        </main>

        <aside className="min-h-0 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <SummaryPanel
            image={image}
            artwork={artwork.settings}
            paper={paper.settings}
          />
        </aside>
      </div>
    </div>
  )
}
