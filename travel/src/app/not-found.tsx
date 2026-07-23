import Link from 'next/link';

import { getTranslator } from '@/i18n/messages';
import { defaultLocale, localeMeta } from '@/i18n/config';

/**
 * Global 404. The root layout is a pass-through, so this boundary renders its
 * own `<html>`/`<body>`. It falls back to the default locale (`en` /
 * x-default) because an unmatched URL — including an invalid locale prefix —
 * cannot be reliably localized. Within-locale not-found refinement can be
 * layered on later with a `[locale]/not-found` boundary.
 */
export default function NotFound() {
  const t = getTranslator(defaultLocale);

  return (
    <html lang={localeMeta[defaultLocale].bcp47} dir={localeMeta[defaultLocale].dir}>
      <body className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">404</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">{t('notFound.title')}</h1>
          <p className="mt-3 text-ink-soft">{t('notFound.description')}</p>
          <Link
            href={`/${defaultLocale}`}
            className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {t('notFound.home')}
          </Link>
        </div>
      </body>
    </html>
  );
}
