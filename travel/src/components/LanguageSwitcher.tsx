'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { locales, localeMeta, type Locale } from '@/i18n/config';

/**
 * Switches to the SAME path under a different locale prefix.
 *
 * Phase 1: swaps the leading `/{locale}` segment. Once localized content slugs
 * exist (Phase 2), article pages will pass explicit `translationKey`-resolved
 * hrefs via the optional `hrefFor` prop so the switcher lands on the
 * translated slug rather than a literal path swap.
 */
export function LanguageSwitcher({
  locale,
  hrefFor,
}: {
  locale: Locale;
  hrefFor?: Partial<Record<Locale, string>>;
}) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);

  function swapLocale(target: Locale): string {
    if (hrefFor?.[target]) return hrefFor[target] as string;
    const segments = pathname.split('/');
    // segments[0] === '' (leading slash), segments[1] === current locale
    segments[1] = target;
    return segments.join('/') || `/${target}`;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
      >
        <span aria-hidden>🌐</span>
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 w-40 overflow-hidden rounded-md border border-line bg-paper py-1 shadow-lg"
        >
          {locales.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <Link
                href={swapLocale(l)}
                lang={localeMeta[l].bcp47}
                hrefLang={localeMeta[l].bcp47}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm hover:bg-paper-muted ${
                  l === locale ? 'font-semibold text-brand' : 'text-ink-soft'
                }`}
              >
                {localeMeta[l].label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
