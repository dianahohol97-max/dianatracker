'use client'

import type { ImageLoaderProps } from 'next/image'

/**
 * Custom next/image loader — currently a pass-through, because previews are
 * presigned R2 URLs and there is no resizing CDN in front of them yet.
 *
 * When Bunny Optimizer / Cloudflare Images lands, this is THE single place
 * to append resize params (e.g. `?width=${width}&quality=${quality}`) so the
 * whole app picks up on-the-fly thumbnails at once. Until then, next.config.js
 * keeps `images.unoptimized: true` so Vercel never proxies media bytes.
 */
export default function storageImageLoader({ src }: ImageLoaderProps): string {
  return src
}
