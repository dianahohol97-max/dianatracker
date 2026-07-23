import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { isLocale, locales } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { getContentByType } from '@/content/loader';
import { formatDate, localeHref } from '@/lib/locale';

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
    title: t('data.title'),
    description: t('data.description'),
    alternates: {
      canonical: `/${locale}/data`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/data`])),
        'x-default': '/en/data',
      },
    },
  };
}

export default async function DataIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslator(locale);
  const pages = getContentByType(locale, 'data').sort((a, b) =>
    a.frontmatter.updatedAt < b.frontmatter.updatedAt ? 1 : -1,
  );

  return (
    <Container className="py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('data.title')}</h1>
        <p className="mt-3 text-ink-soft">{t('data.description')}</p>
      </header>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map(({ frontmatter: fm }) => (
          <li key={fm.slug}>
            <Link
              href={localeHref(locale, `/data/${fm.slug}`)}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-brand"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                {fm.country}
              </span>
              <h2 className="mt-2 text-lg font-semibold text-ink group-hover:text-brand">
                {fm.title}
              </h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-soft">{fm.description}</p>
              <span className="mt-4 text-xs text-ink-soft">
                {t('data.updated')}: {formatDate(fm.dataCheckedAt, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
