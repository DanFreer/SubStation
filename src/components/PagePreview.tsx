import { useEffect, useRef } from 'react'
import { sourceRectForTile } from '../engine/imageProcessor'
import type { TileLayout, TileRect } from '../types'

interface PagePreviewProps {
  imageUrl: string | null
  layout: TileLayout
  tile: TileRect
  mirror: boolean
  scale: number
  /** Inches — left/top paper margins for placing the usable area. */
  marginLeft: number
  marginTop: number
}

/**
 * One sheet: paper → margins → artwork crop (mirrored in source space when on).
 * Tile geometry comes from Stage 2 `calculateTiles`.
 */
export function PagePreview({
  imageUrl,
  layout,
  tile,
  mirror,
  scale,
  marginLeft,
  marginTop,
}: PagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paperW = layout.paper.width * scale
  const paperH = layout.paper.height * scale

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(paperW * dpr))
    canvas.height = Math.max(1, Math.floor(paperH * dpr))
    canvas.style.width = `${paperW}px`
    canvas.style.height = `${paperH}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, paperW, paperH)
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, paperW - 1, paperH - 1)

    const usableX = marginLeft * scale
    const usableY = marginTop * scale
    const usableW = layout.usable.width * scale
    const usableH = layout.usable.height * scale

    ctx.fillStyle = 'rgba(107, 114, 128, 0.12)'
    ctx.fillRect(0, 0, paperW, usableY)
    ctx.fillRect(0, usableY + usableH, paperW, paperH - usableY - usableH)
    ctx.fillRect(0, usableY, usableX, usableH)
    ctx.fillRect(usableX + usableW, usableY, paperW - usableX - usableW, usableH)

    ctx.strokeStyle = '#2563eb'
    ctx.setLineDash([4, 3])
    ctx.strokeRect(usableX, usableY, usableW, usableH)
    ctx.setLineDash([])

    const destX = usableX + tile.pageX * scale
    const destY = usableY + tile.pageY * scale
    const destW = tile.artWidth * scale
    const destH = tile.artHeight * scale

    const drawOverlays = () => {
      if (layout.overlap > 0) {
        ctx.fillStyle = 'rgba(37, 99, 235, 0.22)'
        if (tile.col < layout.cols - 1) {
          const ox = destX + Math.max(0, tile.artWidth - layout.overlap) * scale
          ctx.fillRect(ox, destY, layout.overlap * scale, destH)
        }
        if (tile.row < layout.rows - 1) {
          const oy = destY + Math.max(0, tile.artHeight - layout.overlap) * scale
          ctx.fillRect(destX, oy, destW, layout.overlap * scale)
        }
      }
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 1.5
      ctx.strokeRect(destX, destY, destW, destH)
      ctx.fillStyle = '#1d4ed8'
      ctx.font = `600 ${Math.max(12, Math.round(10 + scale / 8))}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(tile.label, destX + destW / 2, destY + destH / 2)
    }

    if (!imageUrl) {
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(destX, destY, destW, destH)
      drawOverlays()
      return () => {
        cancelled = true
      }
    }

    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const src = sourceRectForTile({
        artX: tile.artX,
        artY: tile.artY,
        artWidth: tile.artWidth,
        artHeight: tile.artHeight,
        artworkWidth: layout.artwork.width,
        mirror,
      })
      const pxPerInX = img.naturalWidth / layout.artwork.width
      const pxPerInY = img.naturalHeight / layout.artwork.height
      ctx.drawImage(
        img,
        src.sx * pxPerInX,
        src.sy * pxPerInY,
        src.sw * pxPerInX,
        src.sh * pxPerInY,
        destX,
        destY,
        destW,
        destH,
      )
      drawOverlays()
    }
    img.onerror = () => {
      if (cancelled) return
      ctx.fillStyle = '#fee2e2'
      ctx.fillRect(destX, destY, destW, destH)
      drawOverlays()
    }
    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [
    imageUrl,
    layout,
    tile,
    mirror,
    scale,
    paperW,
    paperH,
    marginLeft,
    marginTop,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="shadow-sm ring-1 ring-[var(--border)]"
      aria-label={`Page ${tile.label}`}
    />
  )
}
