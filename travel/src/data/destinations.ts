import type { Locale } from '@/i18n/config';

/**
 * Typed destination registry (spec §2 `/data/destinations.ts`).
 *
 * A destination is the hub that aggregates its guides + data pages (matched by
 * the `destination` key in content frontmatter). Names, slugs and blurbs are
 * localised — slugs are natural per language, never transliterations (spec §13).
 */

export interface DestinationLocaleInfo {
  /** Natural, localised slug used in the URL. */
  slug: string;
  name: string;
  /** One-sentence hub intro. */
  blurb: string;
}

export interface Destination {
  /** Stable, locale-independent key — matches `destination` in content frontmatter. */
  key: string;
  region: 'europe' | 'asia' | 'americas' | 'africa' | 'oceania';
  /** ISO-ish country label per locale (display only). */
  country: Record<Locale, string>;
  heroImageAlt: Record<Locale, string>;
  locales: Record<Locale, DestinationLocaleInfo>;
}

export const destinations: Destination[] = [
  {
    key: 'rome',
    region: 'europe',
    country: { en: 'Italy', de: 'Italien', pl: 'Włochy', uk: 'Італія' },
    heroImageAlt: {
      en: 'Rooftops of Rome with St Peter’s dome on the horizon',
      de: 'Dächer Roms mit der Kuppel des Petersdoms am Horizont',
      pl: 'Dachy Rzymu z kopułą Bazyliki św. Piotra na horyzoncie',
      uk: 'Дахи Рима з банею собору Святого Петра на горизонті',
    },
    locales: {
      en: {
        slug: 'rome',
        name: 'Rome',
        blurb:
          'Ancient sites, the Vatican and a walkable historic centre — with verified prices and transport so you plan around queues, not into them.',
      },
      de: {
        slug: 'rom',
        name: 'Rom',
        blurb:
          'Antike Stätten, der Vatikan und ein zu Fuß erkundbares Zentrum — mit geprüften Preisen und Anreise, damit du um die Schlangen herum planst.',
      },
      pl: {
        slug: 'rzym',
        name: 'Rzym',
        blurb:
          'Antyczne zabytki, Watykan i zwarte historyczne centrum — ze zweryfikowanymi cenami i dojazdem, abyś planował wokół kolejek, a nie w nie.',
      },
      uk: {
        slug: 'rym',
        name: 'Рим',
        blurb:
          'Античні памʼятки, Ватикан і компактний історичний центр, а перевірені ціни й транспорт допомагають планувати маршрут навколо черг, а не в них.',
      },
    },
  },
];

export function getDestination(key: string): Destination | undefined {
  return destinations.find((d) => d.key === key);
}

export function getDestinationBySlug(locale: Locale, slug: string): Destination | undefined {
  return destinations.find((d) => d.locales[locale].slug === slug);
}
