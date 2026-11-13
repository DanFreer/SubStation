export {
  GEOMETRY_EPS,
  PDF_POINTS_PER_INCH,
  computeUsableArea,
  convertLength,
  coverageAlongAxis,
  fromInches,
  inchesToPdfPoints,
  isPositiveSize,
  nearlyEqual,
  pdfPointsToInches,
  swapSize,
  tilesNeededAlongAxis,
  toInches,
  uniformMargins,
  validateMargins,
  zeroMargins,
} from './printGeometry'
export { calculateTiles, estimatePageCount } from './tileCalculator'
export {
  sourceRectForTile,
  sourceXForMirroredArt,
} from './imageProcessor'
export type { MirrorAxis } from './imageProcessor'
export { pdfGeneratorStub } from './pdfGenerator'
export {
  DPI_BANDS,
  calculateResolution,
  dpiBandFor,
} from './resolutionCalculator'
export type {
  DpiBand,
  DpiBandId,
  ResolutionInput,
  ResolutionResult,
} from './resolutionCalculator'
