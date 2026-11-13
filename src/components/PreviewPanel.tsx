import { Layers } from 'lucide-react'
import type { ArtworkSettings, UploadedImage } from '../types'

interface PreviewPanelProps {
  image: UploadedImage | null
  artwork: ArtworkSettings
}

export function PreviewPanel({ image, artwork }: PreviewPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--text)]">Preview</h2>
        <span className="text-xs text-[var(--muted)]">
          {artwork.width} × {artwork.height} {artwork.unit}
        </span>
      </header>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[var(--bg)] p-6">
        {image ? (
          <img
            src={image.objectUrl}
            alt="Artwork preview"
            className="max-h-full max-w-full object-contain shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
            <Layers className="h-10 w-10 opacity-40" />
            <p className="text-sm">Upload artwork to preview</p>
            <p className="text-xs">Tile overlays arrive in Stage 3</p>
          </div>
        )}
      </div>
    </section>
  )
}
