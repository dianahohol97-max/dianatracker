import Image from 'next/image';

import type { ImageAsset } from '@/lib/images';

/**
 * Renders a content/hero image via `next/image` with visible attribution
 * (spec §3). Placeholder (SVG data URI) images render unoptimized. A fixed
 * aspect ratio prevents layout shift.
 */
export function ContentImage({
  asset,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 768px',
  className = '',
}: {
  asset: ImageAsset;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <figure className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          priority={priority}
          sizes={sizes}
          unoptimized={asset.isPlaceholder}
          className="object-cover"
        />
      </div>
      {asset.credit && (
        <figcaption className="absolute bottom-0 right-0 rounded-tl bg-black/55 px-2 py-0.5 text-[11px] text-white">
          {asset.credit.author} ·{' '}
          <a
            href={asset.credit.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="underline"
          >
            {asset.credit.source}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
