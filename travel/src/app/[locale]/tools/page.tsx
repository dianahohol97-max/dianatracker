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
    title: t('tools.title'),
    description: t('tools.description'),
    alternates: {
      canonical: `/${locale}/tools`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/tools`])),
        'x-default': '/en/tools',
      },
    },
  };
}

export default async function ToolsIndex({
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
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('tools.title')}</h1>
        <p className="mt-3 text-ink-soft">{t('tools.description')}</p>
      </header>
      <p className="mt-8 rounded-xl border border-dashed border-line bg-paper-muted p-6 text-ink-soft">
        {t('tools.comingSoon')}
      </p>
    </Container>
  );
}
