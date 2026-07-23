import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { isLocale, locales } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';

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
    title: t('about.title'),
    description: t('about.intro'),
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/about`])),
        'x-default': '/en/about',
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslator(locale);

  const sections = [
    { h: t('about.methodologyHeading'), b: t('about.methodologyBody') },
    { h: t('about.sourcesHeading'), b: t('about.sourcesBody') },
    { h: t('about.authorshipHeading'), b: t('about.authorshipBody') },
  ];

  return (
    <Container className="py-12">
      <article className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('about.title')}</h1>
        <p className="mt-4 text-lg text-ink-soft">{t('about.intro')}</p>

        {sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-xl font-semibold text-ink">{s.h}</h2>
            <p className="mt-2 text-ink-soft">{s.b}</p>
          </section>
        ))}
      </article>
    </Container>
  );
}
