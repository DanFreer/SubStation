import { useCallback, useEffect, useRef, useState } from 'react'
import type { UploadedImage } from '../types'

const ACCEPTED = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not read image dimensions'))
    img.src = url
  })
}

export function useImageUpload() {
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeCurrent = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const clear = useCallback(() => {
    revokeCurrent()
    setImage(null)
    setError(null)
  }, [revokeCurrent])

  const loadFile = useCallback(
    async (file: File) => {
      const mime = file.type.toLowerCase()
      if (!ACCEPTED.has(mime) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
        setError('Please upload a PNG, JPG, JPEG, or WebP image.')
        return
      }

      const objectUrl = URL.createObjectURL(file)
      try {
        const { width, height } = await loadImageDimensions(objectUrl)
        revokeCurrent()
        objectUrlRef.current = objectUrl
        setImage({
          file,
          objectUrl,
          widthPx: width,
          heightPx: height,
          name: file.name,
          mimeType: mime || file.type,
        })
        setError(null)
      } catch (err) {
        URL.revokeObjectURL(objectUrl)
        setError(err instanceof Error ? err.message : 'Failed to load image')
      }
    },
    [revokeCurrent],
  )

  useEffect(() => revokeCurrent, [revokeCurrent])

  return { image, error, loadFile, clear }
}
