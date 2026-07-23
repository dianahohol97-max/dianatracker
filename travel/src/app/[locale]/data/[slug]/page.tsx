import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DataFreshness } from '@/components/content/DataFreshness';
import { FAQ } from '@/components/content/FAQ';
import { SourceList } from '@/components/content/SourceList';
import { isLocale, locales, localeMeta, type Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { getContentBySlug, getContentByType, getTranslations } from '@/content/loader';
import type { Frontmatter } from '@/content/schema';
import { RenderMdx } from '@/content/render';
import { formatDate, localeHref } from '@/lib/locale';

// ISR: data pages are re-validated periodically (spec §technical — ISR for data).
export const revalidate = 86400;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getContentByType(locale, 'data').map((doc) => ({ locale, slug: doc.frontmatter.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const doc = getContentBySlug(locale, 'data', slug);
  if (!doc) return {};
  const fm = doc.frontmatter;

  const translations = getTranslations(fm.translationKey);
  const languages: Record<string, string> = {};
  for (const [l, tDoc] of Object.entries(translations)) {
    languages[l] = `/${l}/data/${tDoc.frontmatter.slug}`;
  }
  if (translations.en) languages['x-default'] = `/en/data/${translations.en.frontmatter.slug}`;

  return {
    title: fm.title,
    description: fm.description,
    alternates: { canonical: `/${locale}/data/${fm.slug}`, languages },
    openGraph: {
      type: 'article',
      title: fm.title,
      description: fm.description,
      locale: localeMeta[locale].bcp47,
      modifiedTime: fm.updatedAt,
    },
  };
}

export default async function DataPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const doc = getContentBySlug(locale, 'data', slug);
  if (!doc) notFound();

  const fm = doc.frontmatter;
  const t = getTranslator(locale);

  return (
    <Container as="article" className="py-10">
      <Breadcrumbs
        items={[
          { label: t('site.name'), href: localeHref(locale, '/') },
          { label: t('data.title'), href: localeHref(locale, '/data') },
          { label: fm.title },
        ]}
      />

      <header className="mt-4 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">{fm.country}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{fm.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{fm.description}</p>
        <div className="mt-4">
          <DataFreshness locale={locale} date={fm.dataCheckedAt} />
        </div>
      </header>

      <div className="mt-6 max-w-3xl">
        <RenderMdx locale={locale} source={doc.body} />
        <FAQ locale={locale} items={fm.faq} />
        <SourceList locale={locale} sources={fm.sources} />
        <p className="mt-8 text-xs text-ink-soft">
          {t('data.updated')}: {formatDate(fm.updatedAt, locale)}
        </p>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDataset(locale, fm)) }}
      />
    </Container>
  );
}

/** `Dataset` JSON-LD (spec §9) — data pages are structured datasets. */
function buildDataset(locale: Locale, fm: Frontmatter) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: fm.title,
    description: fm.description,
    inLanguage: localeMeta[locale].bcp47,
    dateModified: fm.updatedAt,
    url: `${SITE}/${locale}/data/${fm.slug}`,
    creator: { '@type': 'Organization', name: 'Tripify' },
    isAccessibleForFree: true,
    citation: fm.sources.map((s) => s.title),
  };
}
