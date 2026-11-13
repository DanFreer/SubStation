import { useEffect, useMemo, useState } from 'react'
import { useArtworkSettings } from '../hooks/useArtworkSettings'
import { useImageUpload } from '../hooks/useImageUpload'
import { usePaperSettings } from '../hooks/usePaperSettings'
import { usePreviewModel } from '../hooks/usePreviewModel'
import { usePrintSettings } from '../hooks/usePrintSettings'
import { loadPreferences, savePreferences } from '../utils/storage'
import { validateAll } from '../utils/validation'
import { ArtworkSettingsPanel } from './ArtworkSettingsPanel'
import { ImageUpload } from './ImageUpload'
import { PaperSettingsPanel } from './PaperSettingsPanel'
import { PreviewPanel } from './PreviewPanel'
import { PrintSettingsPanel } from './PrintSettingsPanel'
import { SummaryPanel } from './SummaryPanel'

const savedPrefs = loadPreferences()

export function AppShell() {
  const { image, error, warning, loadFile, clear } = useImageUpload()
  const pixelAspect =
    image && image.heightPx > 0 ? image.widthPx / image.heightPx : null
  const artwork = useArtworkSettings(pixelAspect, savedPrefs?.artwork ?? null)
  const paper = usePaperSettings(savedPrefs?.paper ?? null)
  const print = usePrintSettings(savedPrefs?.print ?? null)

  const model = usePreviewModel({
    image,
    artwork: artwork.settings,
    paper: paper.settings,
    print: print.settings,
  })

  const issues = useMemo(
    () =>
      validateAll({
        artwork: artwork.settings,
        paper: paper.settings,
        print: print.settings,
      }),
    [artwork.settings, paper.settings, print.settings],
  )

  const [prefsReady, setPrefsReady] = useState(false)
  useEffect(() => {
    setPrefsReady(true)
  }, [])

  useEffect(() => {
    if (!prefsReady) return
    savePreferences({
      version: 1,
      artwork: artwork.settings,
      paper: paper.settings,
      print: print.settings,
    })
  }, [artwork.settings, paper.settings, print.settings, prefsReady])

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
          Stage 5 · polish
        </p>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <ImageUpload
            image={image}
            error={error}
            warning={warning}
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
          <PrintSettingsPanel
            settings={print.settings}
            onUniformMargin={print.setUniformMargin}
            onMargin={print.setMargin}
            onOverlap={print.setOverlap}
            onUnit={print.setUnit}
            onMirror={print.setMirror}
            onOrientationPreference={print.setOrientationPreference}
            onMark={print.setMark}
          />
          {issues.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              <p className="font-medium">Check settings</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {issues.map((issue) => (
                  <li key={`${issue.field}:${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-[var(--muted)]">
            Preferences (sizes, paper, overlap, mirror, marks) save in this
            browser only. Uploaded images are never stored.
          </p>
        </aside>

        <main className="min-h-[320px] min-w-0">
          <PreviewPanel model={model} />
        </main>

        <aside className="min-h-0 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <SummaryPanel
            model={model}
            printSettings={print.settings}
            validationBlocking={issues.length > 0}
          />
        </aside>
      </div>
    </div>
  )
}
