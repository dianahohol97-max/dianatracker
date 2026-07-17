'use client'

import { Heart } from 'lucide-react'
import { useState } from 'react'
import type { AssetKind } from '@/lib/types'

export interface GridItem {
  id: string
  kind: AssetKind
  width: number | null
  height: number | null
  previewUrl: string
  downloadHref: string
}

/**
 * Image-first masonry grid for the public gallery. Plain <img> on purpose:
 * previews are presigned R2 URLs and Vercel image optimization must not
 * proxy them (see next.config.js / lib/images/loader.ts for the CDN plan).
 * Favorites toggle optimistically and sync via /selections.
 */
export function GalleryGrid({
  items,
  slug,
  downloadLabel,
  favoriteLabel,
  initialFavorites,
}: {
  items: GridItem[]
  slug: string
  downloadLabel: string
  favoriteLabel: string
  initialFavorites: string[]
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set(initialFavorites))

  async function toggleFavorite(assetId: string) {
    const selected = !favorites.has(assetId)
    setFavorites((prev) => {
      const next = new Set(prev)
      if (selected) next.add(assetId)
      else next.delete(assetId)
      return next
    })
    const response = await fetch(`/api/galleries/${slug}/selections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, kind: 'favorite', selected }),
    })
    if (!response.ok) {
      // Roll the optimistic update back on failure.
      setFavorites((prev) => {
        const next = new Set(prev)
        if (selected) next.delete(assetId)
        else next.add(assetId)
        return next
      })
    }
  }

  return (
    <div className="masonry">
      {items.map((item) => {
        const isFavorite = favorites.has(item.id)
        return (
          <figure key={item.id} className="group relative">
            {item.kind === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.previewUrl}
                alt=""
                loading="lazy"
                width={item.width ?? undefined}
                height={item.height ?? undefined}
                className="w-full"
              />
            ) : (
              <video src={item.previewUrl} controls playsInline className="w-full" />
            )}

            <button
              type="button"
              aria-label={favoriteLabel}
              aria-pressed={isFavorite}
              onClick={() => void toggleFavorite(item.id)}
              className={`absolute right-3 top-3 rounded-full bg-bg/90 p-2 transition-opacity ${
                isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <Heart
                size={18}
                className={isFavorite ? 'fill-accent text-accent' : 'text-fg'}
              />
            </button>

            <a
              href={item.downloadHref}
              className="absolute bottom-3 right-3 bg-bg/90 px-3 py-1.5 text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100"
            >
              {downloadLabel}
            </a>
          </figure>
        )
      })}
    </div>
  )
}
