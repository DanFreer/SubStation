import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { TileLayout } from '../types'
import { SEAM_NUDGE_IN } from '../hooks/useSeamOverrides'

interface FullArtworkPreviewProps {
  imageUrl: string | null
  layout: TileLayout
  mirror: boolean
  scale: number
  highlightPageIndex: number | null
  onVerticalSeam?: (index: number, positionIn: number) => void
  onHorizontalSeam?: (index: number, positionIn: number) => void
  onNudgeVertical?: (index: number, dir: 1 | -1) => void
  onNudgeHorizontal?: (index: number, dir: 1 | -1) => void
  showSeamControls?: boolean
}

type SeamDrag =
  | { axis: 'v'; index: number }
  | { axis: 'h'; index: number }

export function FullArtworkPreview({
  imageUrl,
  layout,
  mirror,
  scale,
  highlightPageIndex,
  onVerticalSeam,
  onHorizontalSeam,
  onNudgeVertical,
  onNudgeHorizontal,
  showSeamControls = true,
}: FullArtworkPreviewProps) {
  const width = layout.artwork.width * scale
  const height = layout.artwork.height * scale
  const { overlap } = layout
  const [drag, setDrag] = useState<SeamDrag | null>(null)

  const clientToArt = useCallback(
    (clientX: number, clientY: number, el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      const x = ((clientX - r.left) / r.width) * layout.artwork.width
      const y = ((clientY - r.top) / r.height) * layout.artwork.height
      return { x, y }
    },
    [layout.artwork.width, layout.artwork.height],
  )

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return
    const { x, y } = clientToArt(e.clientX, e.clientY, e.currentTarget)
    if (drag.axis === 'v') onVerticalSeam?.(drag.index, x)
    else onHorizontalSeam?.(drag.index, y)
  }

  const onPointerUp = () => setDrag(null)

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative shrink-0 bg-[var(--surface)] shadow-sm ring-1 ring-[var(--border)]"
        style={{ width, height }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Finished media"
            draggable={false}
            className="absolute inset-0 h-full w-full object-fill"
            style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
          />
        ) : (
          <div className="absolute inset-0 bg-[#e5e7eb]" />
        )}

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${layout.artwork.width} ${layout.artwork.height}`}
          preserveAspectRatio="none"
        >
          {layout.tiles.map((tile) => {
            const active = highlightPageIndex === tile.pageIndex
            const rightSeam =
              tile.col < layout.cols - 1
                ? layout.verticalSeams[tile.col]
                : null
            const bottomSeam =
              tile.row < layout.rows - 1
                ? layout.horizontalSeams[tile.row]
                : null
            const rightOverlap =
              rightSeam != null && overlap > 0
                ? Math.min(
                    overlap,
                    Math.max(
                      0,
                      tile.artX + tile.artWidth - (rightSeam - overlap / 2),
                    ),
                  )
                : 0
            const bottomOverlap =
              bottomSeam != null && overlap > 0
                ? Math.min(
                    overlap,
                    Math.max(
                      0,
                      tile.artY + tile.artHeight - (bottomSeam - overlap / 2),
                    ),
                  )
                : 0

            return (
              <g key={tile.pageIndex}>
                {rightOverlap > 0 && rightSeam != null && (
                  <rect
                    x={rightSeam - overlap / 2}
                    y={tile.artY}
                    width={rightOverlap}
                    height={tile.artHeight}
                    fill="rgba(37, 99, 235, 0.2)"
                  />
                )}
                {bottomOverlap > 0 && bottomSeam != null && (
                  <rect
                    x={tile.artX}
                    y={bottomSeam - overlap / 2}
                    width={tile.artWidth}
                    height={bottomOverlap}
                    fill="rgba(37, 99, 235, 0.2)"
                  />
                )}
                <rect
                  x={tile.artX}
                  y={tile.artY}
                  width={tile.artWidth}
                  height={tile.artHeight}
                  fill={active ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}
                  stroke={active ? '#2563eb' : '#111827'}
                  strokeWidth={active ? 0.07 : 0.04}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={tile.artX + tile.artWidth / 2}
                  y={tile.artY + tile.artHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1d4ed8"
                  fontSize={Math.max(
                    0.3,
                    Math.min(tile.artWidth, tile.artHeight) * 0.16,
                  )}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={700}
                >
                  {tile.label}
                </text>
              </g>
            )
          })}

          {/* Seam center lines */}
          {layout.verticalSeams.map((s, i) => (
            <line
              key={`vs-${i}`}
              x1={s}
              y1={0}
              x2={s}
              y2={layout.artwork.height}
              stroke="#dc2626"
              strokeWidth={0.05}
              strokeDasharray="0.15 0.1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {layout.horizontalSeams.map((s, i) => (
            <line
              key={`hs-${i}`}
              x1={0}
              y1={s}
              x2={layout.artwork.width}
              y2={s}
              stroke="#dc2626"
              strokeWidth={0.05}
              strokeDasharray="0.15 0.1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Interactive seam hit targets (HTML for pointer capture) */}
        {showSeamControls &&
          layout.verticalSeams.map((s, i) => (
            <div
              key={`vhit-${i}`}
              role="slider"
              aria-label={`Vertical seam ${i + 1}`}
              aria-valuenow={Number(s.toFixed(3))}
              tabIndex={0}
              className="absolute top-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize bg-red-500/20 hover:bg-red-500/35"
              style={{ left: s * scale, height }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                setDrag({ axis: 'v', index: i })
              }}
            />
          ))}
        {showSeamControls &&
          layout.horizontalSeams.map((s, i) => (
            <div
              key={`hhit-${i}`}
              role="slider"
              aria-label={`Horizontal seam ${i + 1}`}
              aria-valuenow={Number(s.toFixed(3))}
              tabIndex={0}
              className="absolute left-0 z-10 h-3 -translate-y-1/2 cursor-ns-resize bg-red-500/20 hover:bg-red-500/35"
              style={{ top: s * scale, width }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                setDrag({ axis: 'h', index: i })
              }}
            />
          ))}
      </div>

      {showSeamControls &&
        (layout.verticalSeams.length > 0 || layout.horizontalSeams.length > 0) && (
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--muted)]">
            <span>Seams (drag or nudge ±{SEAM_NUDGE_IN}&quot;)</span>
            {layout.verticalSeams.map((s, i) => (
              <span
                key={`vn-${i}`}
                className="inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-white px-1 py-0.5"
              >
                V{i + 1} {s.toFixed(2)}&quot;
                <button
                  type="button"
                  className="min-h-7 min-w-7 rounded hover:bg-[var(--bg)]"
                  aria-label={`Nudge vertical seam ${i + 1} left`}
                  onClick={() => onNudgeVertical?.(i, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="min-h-7 min-w-7 rounded hover:bg-[var(--bg)]"
                  aria-label={`Nudge vertical seam ${i + 1} right`}
                  onClick={() => onNudgeVertical?.(i, 1)}
                >
                  +
                </button>
              </span>
            ))}
            {layout.horizontalSeams.map((s, i) => (
              <span
                key={`hn-${i}`}
                className="inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-white px-1 py-0.5"
              >
                H{i + 1} {s.toFixed(2)}&quot;
                <button
                  type="button"
                  className="min-h-7 min-w-7 rounded hover:bg-[var(--bg)]"
                  aria-label={`Nudge horizontal seam ${i + 1} up`}
                  onClick={() => onNudgeHorizontal?.(i, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="min-h-7 min-w-7 rounded hover:bg-[var(--bg)]"
                  aria-label={`Nudge horizontal seam ${i + 1} down`}
                  onClick={() => onNudgeHorizontal?.(i, 1)}
                >
                  +
                </button>
              </span>
            ))}
          </div>
        )}
    </div>
  )
}
