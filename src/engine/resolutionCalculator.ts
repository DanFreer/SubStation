export type DpiBandId = 'low' | 'fair' | 'good' | 'excellent'

export interface DpiBand {
  id: DpiBandId
  /** Inclusive lower bound; null = −∞ */
  minDpi: number | null
  /** Exclusive upper bound; null = +∞ */
  maxDpi: number | null
  label: string
  /** Tailwind-ish tone for UI warnings */
  tone: 'danger' | 'warn' | 'info' | 'ok'
  message: string
}

export const DPI_BANDS: DpiBand[] = [
  {
    id: 'low',
    minDpi: null,
    maxDpi: 100,
    label: 'Below 100 DPI',
    tone: 'danger',
    message: 'Very low resolution — print will look soft or pixelated.',
  },
  {
    id: 'fair',
    minDpi: 100,
    maxDpi: 150,
    label: '100–149 DPI',
    tone: 'warn',
    message: 'Fair resolution — acceptable for large viewing distance only.',
  },
  {
    id: 'good',
    minDpi: 150,
    maxDpi: 300,
    label: '150–299 DPI',
    tone: 'info',
    message: 'Good resolution for most sublimation work.',
  },
  {
    id: 'excellent',
    minDpi: 300,
    maxDpi: null,
    label: '300+ DPI',
    tone: 'ok',
    message: 'Excellent resolution for close viewing.',
  },
]

export interface ResolutionInput {
  widthPx: number
  heightPx: number
  /** Finished artwork size in inches. */
  widthIn: number
  heightIn: number
}

export interface ResolutionResult {
  /** Effective DPI = min(px/in on each axis). Never invents upscale. */
  dpi: number
  dpiX: number
  dpiY: number
  band: DpiBand
}

export function dpiBandFor(dpi: number): DpiBand {
  for (const band of DPI_BANDS) {
    const aboveMin = band.minDpi == null || dpi >= band.minDpi
    const belowMax = band.maxDpi == null || dpi < band.maxDpi
    if (aboveMin && belowMax) return band
  }
  return DPI_BANDS[DPI_BANDS.length - 1]!
}

/**
 * Effective print DPI from source pixels vs finished physical size.
 * Does not upscale or invent pixels — export is never blocked by band.
 */
export function calculateResolution(
  input: ResolutionInput,
): { ok: true; result: ResolutionResult } | { ok: false; error: string } {
  const { widthPx, heightPx, widthIn, heightIn } = input
  if (!(widthPx > 0 && heightPx > 0)) {
    return { ok: false, error: 'Image pixel dimensions must be positive' }
  }
  if (!(widthIn > 0 && heightIn > 0)) {
    return { ok: false, error: 'Artwork dimensions must be positive' }
  }

  const dpiX = widthPx / widthIn
  const dpiY = heightPx / heightIn
  const dpi = Math.min(dpiX, dpiY)

  if (!Number.isFinite(dpi) || dpi <= 0) {
    return { ok: false, error: 'Unable to compute DPI from the given sizes' }
  }

  return {
    ok: true,
    result: {
      dpi,
      dpiX,
      dpiY,
      band: dpiBandFor(dpi),
    },
  }
}
