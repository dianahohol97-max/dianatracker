/**
 * Grab a still frame from a video File in the browser, so gallery grids can
 * show a lightweight poster instead of streaming the multi-hundred-MB original
 * just to render a tile. Runs entirely client-side (the File is a same-origin
 * blob URL, so drawing it to a canvas does not taint the output).
 *
 * Returns null on any failure — the poster is an optimization, never required.
 */
export async function generateVideoPoster(
  file: File,
  maxSize = 1280
): Promise<{ blob: Blob; width: number; height: number } | null> {
  if (!file.type.startsWith('video/')) return null

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    let settled = false
    const finish = (result: { blob: Blob; width: number; height: number } | null) => {
      if (settled) return
      settled = true
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      video.load()
      resolve(result)
    }

    // Safety net: never hang the upload on a codec the browser can't decode.
    const timeout = setTimeout(() => finish(null), 15000)

    video.onloadedmetadata = () => {
      // A frame a moment in — the very first frame is often black.
      const target = Math.min(1, (video.duration || 2) / 2)
      video.onseeked = () => {
        clearTimeout(timeout)
        try {
          const vw = video.videoWidth
          const vh = video.videoHeight
          if (!vw || !vh) return finish(null)
          const scale = Math.min(1, maxSize / Math.max(vw, vh))
          const w = Math.max(1, Math.round(vw * scale))
          const h = Math.max(1, Math.round(vh * scale))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) return finish(null)
          ctx.drawImage(video, 0, 0, w, h)
          canvas.toBlob(
            (blob) => finish(blob ? { blob, width: vw, height: vh } : null),
            'image/jpeg',
            0.82
          )
        } catch {
          finish(null)
        }
      }
      try {
        video.currentTime = target
      } catch {
        finish(null)
      }
    }
    video.onerror = () => {
      clearTimeout(timeout)
      finish(null)
    }
    video.src = url
  })
}
