import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import type { UploadedImage } from '../types'

interface ImageUploadProps {
  image: UploadedImage | null
  error: string | null
  warning?: string | null
  onFile: (file: File) => void
  onClear: () => void
}

export function ImageUpload({
  image,
  error,
  warning = null,
  onFile,
  onClear,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (file) onFile(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files)
  }

  const aspect =
    image && image.heightPx > 0
      ? (image.widthPx / image.heightPx).toFixed(3)
      : null

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
          Upload
        </h2>
        {image && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-4 transition-colors ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
            : 'border-[var(--border)] bg-[var(--surface)]'
        }`}
      >
        {image ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-md bg-[var(--bg)]">
              <img
                src={image.objectUrl}
                alt={image.name}
                className="mx-auto max-h-40 object-contain"
              />
            </div>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
              <dt>File</dt>
              <dd className="truncate text-right text-[var(--text)]" title={image.name}>
                {image.name}
              </dd>
              <dt>Pixels</dt>
              <dd className="text-right text-[var(--text)]">
                {image.widthPx} × {image.heightPx}
              </dd>
              <dt>Aspect</dt>
              <dd className="text-right text-[var(--text)]">{aspect}</dd>
            </dl>
            {image.mimeType === 'image/png' && (
              <p className="text-xs text-[var(--muted)]">
                PNG transparency is preserved locally (export in Stage 4).
              </p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--bg)]"
            >
              <Upload className="h-4 w-4" />
              Replace image
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 py-6 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
          >
            <ImagePlus className="h-8 w-8" />
            <span>Drop PNG / JPG / WebP here, or click to browse</span>
            <span className="text-xs">Images stay in this browser only</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {warning && !error && (
        <p className="text-xs text-amber-700">{warning}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </section>
  )
}
