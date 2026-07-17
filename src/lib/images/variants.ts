'use client'

/**
 * Client-side rendition generation. Runs in the browser at upload time so the
 * MVP gets thumb/preview variants with ZERO server infrastructure — the same
 * presigned-PUT path used for originals. When a real image pipeline (worker +
 * watermark) lands, it replaces this file and starts filling assets.variants
 * server-side; nothing else changes.
 *
 * Rule encoded here: gallery viewing NEVER serves originals. The preview cap
 * (2048px) is plenty for screens; originals are only reachable through the
 * explicit download endpoint.
 */

export interface GeneratedVariant {
  name: 'preview' | 'thumb'
  blob: Blob
}

const TARGETS: { name: 'preview' | 'thumb'; maxDim: number; quality: number }[] = [
  { name: 'preview', maxDim: 2048, quality: 0.85 },
  { name: 'thumb', maxDim: 512, quality: 0.8 },
]

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export async function generateImageVariants(file: File): Promise<GeneratedVariant[]> {
  if (!file.type.startsWith('image/')) return []

  let bitmap: ImageBitmap
  try {
    // 'from-image' bakes EXIF orientation in, so variants are always upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return [] // Unsupported format (e.g. some HEICs) — viewer falls back to the original.
  }

  const variants: GeneratedVariant[] = []
  try {
    for (const target of TARGETS) {
      const scale = target.maxDim / Math.max(bitmap.width, bitmap.height)
      if (scale >= 1) continue // Original is already small enough — fallback covers it.

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext('2d')
      if (!context) continue
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const blob = await canvasToJpeg(canvas, target.quality)
      if (blob) variants.push({ name: target.name, blob })
    }
  } finally {
    bitmap.close()
  }
  return variants
}
