import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { isLocale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getTranslator(locale);

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-brand-soft/40 to-paper">
        <Container className="py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              {t('site.name')}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-5 text-lg text-ink-soft">{t('home.heroSubtitle')}</p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <PlaceholderCard title={t('home.topDestinations')} />
          <PlaceholderCard title={t('home.latestGuides')} />
          <PlaceholderCard title={t('home.exploreTools')} />
        </div>
      </Container>
    </>
  );
}

/**
 * Phase 1 placeholder. These become real destination / guide / tool grids in
 * Phase 3 once the MDX content pipeline (Phase 2) is in place.
 */
function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper-muted p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Coming in Phase 3 — wired to the content pipeline.
      </p>
    </div>
  );
}
