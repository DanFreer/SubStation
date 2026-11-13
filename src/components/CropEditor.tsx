import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { CropRectNorm } from '../types'
import { normalizeCrop } from '../engine/imageProcessor'

interface CropEditorProps {
  imageUrl: string
  imageWidthPx: number
  imageHeightPx: number
  crop: CropRectNorm
  onChange: (crop: CropRectNorm) => void
  lockToMediaAspect: boolean
  mediaAspect: number
}

type DragMode =
  | { kind: 'move'; ox: number; oy: number; start: CropRectNorm }
  | { kind: 'resize'; handle: string; start: CropRectNorm; ox: number; oy: number }

/**
 * Drag/resize crop rectangle on the source artwork preview.
 * Coordinates are normalized fractions of the image.
 */
export function CropEditor({
  imageUrl,
  crop,
  onChange,
  lockToMediaAspect,
  mediaAspect,
}: CropEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragMode | null>(null)
  const rect = normalizeCrop(crop)

  const clientToNorm = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    }
  }, [])

  const onPointerDown = (
    e: ReactPointerEvent,
    mode: DragMode['kind'],
    handle?: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const start = { ...rect }
    if (mode === 'move') {
      const p = clientToNorm(e.clientX, e.clientY)
      setDrag({ kind: 'move', ox: p.x - start.x, oy: p.y - start.y, start })
    } else {
      setDrag({
        kind: 'resize',
        handle: handle ?? 'se',
        start,
        ox: e.clientX,
        oy: e.clientY,
      })
    }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return
    const p = clientToNorm(e.clientX, e.clientY)
    if (drag.kind === 'move') {
      let x = p.x - drag.ox
      let y = p.y - drag.oy
      x = Math.min(Math.max(0, x), 1 - drag.start.width)
      y = Math.min(Math.max(0, y), 1 - drag.start.height)
      onChange(normalizeCrop({ ...drag.start, x, y }))
      return
    }

    const s = drag.start
    let { x, y, width, height } = s
    const h = drag.handle

    if (h.includes('e')) width = Math.max(0.02, p.x - s.x)
    if (h.includes('s')) height = Math.max(0.02, p.y - s.y)
    if (h.includes('w')) {
      const right = s.x + s.width
      x = Math.min(p.x, right - 0.02)
      width = right - x
    }
    if (h.includes('n')) {
      const bottom = s.y + s.height
      y = Math.min(p.y, bottom - 0.02)
      height = bottom - y
    }

    if (lockToMediaAspect && mediaAspect > 0) {
      // Keep aspect; anchor opposite corner
      if (h === 'e' || h === 'w') height = width / mediaAspect
      else if (h === 'n' || h === 's') width = height * mediaAspect
      else {
        height = width / mediaAspect
      }
      if (h.includes('n')) y = s.y + s.height - height
      if (h.includes('w')) x = s.x + s.width - width
    }

    onChange(normalizeCrop({ x, y, width, height }))
  }

  const onPointerUp = () => setDrag(null)

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[var(--muted)]">
        Drag the crop box on the artwork. FIT/FILL/STRETCH apply inside the crop.
      </p>
      <div
        ref={wrapRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-[var(--bg)] ring-1 ring-[var(--border)]"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={imageUrl}
          alt="Artwork crop source"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {/* Dim outside crop — approximate using object-contain is imperfect;
            we overlay in normalized image space via a second absolute layer. */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute bg-black/45"
            style={{ left: 0, top: 0, width: '100%', height: `${rect.y * 100}%` }}
          />
          <div
            className="absolute bg-black/45"
            style={{
              left: 0,
              top: `${(rect.y + rect.height) * 100}%`,
              width: '100%',
              height: `${(1 - rect.y - rect.height) * 100}%`,
            }}
          />
          <div
            className="absolute bg-black/45"
            style={{
              left: 0,
              top: `${rect.y * 100}%`,
              width: `${rect.x * 100}%`,
              height: `${rect.height * 100}%`,
            }}
          />
          <div
            className="absolute bg-black/45"
            style={{
              left: `${(rect.x + rect.width) * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${(1 - rect.x - rect.width) * 100}%`,
              height: `${rect.height * 100}%`,
            }}
          />
        </div>

        <div
          role="presentation"
          className="absolute cursor-move border-2 border-[var(--accent)] bg-transparent"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.width * 100}%`,
            height: `${rect.height * 100}%`,
          }}
          onPointerDown={(e) => onPointerDown(e, 'move')}
        >
          {handles.map((handle) => (
            <button
              key={handle}
              type="button"
              aria-label={`Resize crop ${handle}`}
              className={`absolute h-2.5 w-2.5 rounded-sm bg-[var(--accent)] ${handleClass(handle)}`}
              onPointerDown={(e) => onPointerDown(e, 'resize', handle)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function handleClass(handle: string): string {
  const map: Record<string, string> = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
    s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  }
  return map[handle] ?? ''
}
