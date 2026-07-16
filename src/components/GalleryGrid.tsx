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
 */
export function GalleryGrid({
  items,
  downloadLabel,
}: {
  items: GridItem[]
  downloadLabel: string
}) {
  return (
    <div className="masonry">
      {items.map((item) => (
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
          <a
            href={item.downloadHref}
            className="absolute bottom-3 right-3 bg-bg/90 px-3 py-1.5 text-xs uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100"
          >
            {downloadLabel}
          </a>
        </figure>
      ))}
    </div>
  )
}
