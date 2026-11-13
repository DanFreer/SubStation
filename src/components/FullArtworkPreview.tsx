import type { TileLayout } from '../types'

interface FullArtworkPreviewProps {
  imageUrl: string | null
  layout: TileLayout
  mirror: boolean
  scale: number
  highlightPageIndex: number | null
}

export function FullArtworkPreview({
  imageUrl,
  layout,
  mirror,
  scale,
  highlightPageIndex,
}: FullArtworkPreviewProps) {
  const width = layout.artwork.width * scale
  const height = layout.artwork.height * scale
  const { overlap } = layout
  const stepX = layout.usable.width - overlap
  const stepY = layout.usable.height - overlap

  return (
    <div
      className="relative shrink-0 bg-[var(--surface)] shadow-sm ring-1 ring-[var(--border)]"
      style={{ width, height }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Finished artwork"
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
          const rightOverlap =
            tile.col < layout.cols - 1 && overlap > 0
              ? Math.min(overlap, Math.max(0, tile.artX + tile.artWidth - (tile.artX + stepX)))
              : 0
          const bottomOverlap =
            tile.row < layout.rows - 1 && overlap > 0
              ? Math.min(overlap, Math.max(0, tile.artY + tile.artHeight - (tile.artY + stepY)))
              : 0

          return (
            <g key={tile.pageIndex}>
              {rightOverlap > 0 && (
                <rect
                  x={tile.artX + stepX}
                  y={tile.artY}
                  width={rightOverlap}
                  height={tile.artHeight}
                  fill="rgba(37, 99, 235, 0.2)"
                />
              )}
              {bottomOverlap > 0 && (
                <rect
                  x={tile.artX}
                  y={tile.artY + stepY}
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
      </svg>
    </div>
  )
}
