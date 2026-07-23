import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { DestinationCard } from '@/components/DestinationCard';
import { isLocale, locales } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { destinations } from '@/data/destinations';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getTranslator(locale);
  return {
    title: t('destinations.title'),
    description: t('destinations.description'),
    alternates: {
      canonical: `/${locale}/destinations`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/destinations`])),
        'x-default': '/en/destinations',
      },
    },
  };
}

export default async function DestinationsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslator(locale);

  return (
    <Container className="py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('destinations.title')}</h1>
        <p className="mt-3 text-ink-soft">{t('destinations.description')}</p>
      </header>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <li key={destination.key}>
            <DestinationCard locale={locale} destination={destination} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
