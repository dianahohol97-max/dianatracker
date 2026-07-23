import { placeholderDataUri } from './placeholder';

/**
 * Image layer (spec §3).
 *
 * Approved sources only: affiliate APIs (GetYourGuide / Viator), Unsplash /
 * Pexels (free for commercial use, attribution stored), Wikimedia Commons
 * (licence-checked). NEVER AI-generated photos of real places, never Google
 * Images. Attribution always travels with the asset and is shown in the UI.
 *
 * Phase 2 ships the abstraction + placeholder fallback; live provider fetching
 * (with API keys) is wired in Phase 4 alongside the affiliate layer.
 */

export interface ImageCredit {
  author: string;
  /** Human-readable source name, e.g. "Unsplash", "Wikimedia Commons". */
  source: string;
  url: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  credit: ImageCredit | null;
  /** True when we fell back to the generated placeholder. */
  isPlaceholder: boolean;
}

/**
 * Resolve a content image from its frontmatter fields. If `src` is absent we
 * return the deterministic placeholder so nothing breaks the build or layout.
 */
export function resolveImage(input: {
  src?: string;
  alt: string;
  credit?: ImageCredit;
  placeholderLabel?: string;
}): ImageAsset {
  if (!input.src) {
    return {
      src: placeholderDataUri(input.placeholderLabel),
      alt: input.alt,
      credit: null,
      isPlaceholder: true,
    };
  }
  return {
    src: input.src,
    alt: input.alt,
    credit: input.credit ?? null,
    isPlaceholder: false,
  };
}
