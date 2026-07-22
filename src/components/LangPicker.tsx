'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales, type Locale } from '@/lib/i18n/config'

const LABELS: Record<Locale, string> = {
  uk: 'UA',
  en: 'EN',
  pl: 'PL',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  it: 'IT',
  ro: 'RO',
  pt: 'PT',
}

/**
 * Client-facing language switcher: keeps the current path and swaps the
 * leading /{locale} segment, so a visitor stays on the same gallery/booking
 * page in their language. Used on public pages that clients (not the
 * photographer) see.
 */
export function LangPicker({ current }: { current: Locale }) {
  const pathname = usePathname()
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  return (
    <nav aria-label="Language" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          hrefLang={l}
          aria-current={l === current ? 'true' : undefined}
          className="no-underline transition-opacity"
          style={{
            color: 'inherit',
            fontWeight: l === current ? 700 : 500,
            opacity: l === current ? 1 : 0.55,
          }}
        >
          {LABELS[l]}
        </Link>
      ))}
    </nav>
  )
}
