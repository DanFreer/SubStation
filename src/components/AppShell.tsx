import { FileDown, LayoutGrid, Settings2 } from 'lucide-react'
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

type MobileTab = 'controls' | 'preview' | 'export'

const MOBILE_TABS: {
  id: MobileTab
  label: string
  icon: typeof Settings2
}[] = [
  { id: 'controls', label: 'Controls', icon: Settings2 },
  { id: 'preview', label: 'Preview', icon: LayoutGrid },
  { id: 'export', label: 'Export', icon: FileDown },
]

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
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview')

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

  const controlsPanel = (
    <>
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
        Preferences (sizes, paper, overlap, mirror, marks) save in this browser
        only. Uploaded images are never stored.
      </p>
    </>
  )

  return (
    <div className="flex h-full min-h-0 flex-col pb-[env(safe-area-inset-bottom)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Sublimation Print Studio
          </p>
          <h1 className="text-lg font-semibold text-[var(--text)]">SubStation</h1>
        </div>
        <p className="hidden text-xs text-[var(--muted)] sm:block">
          Stage 6 · mobile
        </p>
      </header>

      {/* Desktop / large tablet: three-column shell */}
      <div className="hidden min-h-0 flex-1 gap-3 p-3 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          {controlsPanel}
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

      {/* Phone / small tablet: one panel + bottom tabs */}
      <div className="relative z-0 flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-2">
          {mobileTab === 'controls' && (
            <aside
              id="panel-controls"
              role="tabpanel"
              aria-labelledby="tab-controls"
              className="flex flex-col gap-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              {controlsPanel}
            </aside>
          )}
          {mobileTab === 'preview' && (
            <main
              id="panel-preview"
              role="tabpanel"
              aria-labelledby="tab-preview"
              className="flex h-full min-h-[min(60dvh,24rem)] flex-col"
            >
              <PreviewPanel model={model} />
            </main>
          )}
          {mobileTab === 'export' && (
            <aside
              id="panel-export"
              role="tabpanel"
              aria-labelledby="tab-export"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <SummaryPanel
                model={model}
                printSettings={print.settings}
                validationBlocking={issues.length > 0}
              />
            </aside>
          )}
        </div>

        <nav
          className="relative z-20 shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(15,23,42,0.06)]"
          aria-label="Studio panels"
        >
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="mx-auto grid max-w-md grid-cols-3 gap-1"
          >
            {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
              const active = mobileTab === id
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setMobileTab(id)}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                      : 'text-[var(--muted)] hover:bg-[var(--bg)] active:bg-[var(--bg)]'
                  }`}
                >
                  <Icon className="pointer-events-none h-5 w-5" aria-hidden />
                  <span className="pointer-events-none">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
