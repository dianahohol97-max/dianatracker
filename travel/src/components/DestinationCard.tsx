import Link from 'next/link';

import type { Locale } from '@/i18n/config';
import type { Destination } from '@/data/destinations';
import { localeHref } from '@/lib/locale';

/** Card linking to a destination hub, used on the home page and index. */
export function DestinationCard({
  locale,
  destination,
}: {
  locale: Locale;
  destination: Destination;
}) {
  const info = destination.locales[locale];
  return (
    <Link
      href={localeHref(locale, `/destinations/${info.slug}`)}
      className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-brand"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-brand">
        {destination.country[locale]}
      </span>
      <h3 className="mt-1 text-lg font-semibold text-ink group-hover:text-brand">{info.name}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-soft">{info.blurb}</p>
    </Link>
  );
}
