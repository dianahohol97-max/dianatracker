import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { ContentImage } from '@/components/content/ContentImage';
import { DataFreshness } from '@/components/content/DataFreshness';
import { FAQ } from '@/components/content/FAQ';
import { SourceList } from '@/components/content/SourceList';
import { isLocale, locales, localeMeta, type Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { getContentBySlug, getContentByType, getTranslations } from '@/content/loader';
import type { Frontmatter } from '@/content/schema';
import { RenderMdx } from '@/content/render';
import { resolveImage } from '@/lib/images';
import { formatDate, localeHref } from '@/lib/locale';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getContentByType(locale, 'guide').map((doc) => ({ locale, slug: doc.frontmatter.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const doc = getContentBySlug(locale, 'guide', slug);
  if (!doc) return {};

  const fm = doc.frontmatter;
  const translations = getTranslations(fm.translationKey);

  // hreflang alternates from the actual translated slugs (spec §4).
  const languages: Record<string, string> = {};
  for (const [l, tDoc] of Object.entries(translations)) {
    languages[l] = `/${l}/guides/${tDoc.frontmatter.slug}`;
  }
  if (translations.en) languages['x-default'] = `/en/guides/${translations.en.frontmatter.slug}`;

  return {
    title: fm.title,
    description: fm.description,
    alternates: { canonical: `/${locale}/guides/${fm.slug}`, languages },
    openGraph: {
      type: 'article',
      title: fm.title,
      description: fm.description,
      locale: localeMeta[locale].bcp47,
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const doc = getContentBySlug(locale, 'guide', slug);
  if (!doc) notFound();

  const fm = doc.frontmatter;
  const t = getTranslator(locale);

  const hero = resolveImage({
    src: fm.heroImage,
    alt: fm.heroImageAlt,
    credit: fm.imageCredit,
    placeholderLabel: fm.country,
  });

  const jsonLd = buildJsonLd(locale, fm.slug, doc.frontmatter);

  return (
    <Container as="article" className="py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-ink-soft">
        <Link href={localeHref(locale, '/')} className="hover:text-brand">
          {t('site.name')}
        </Link>
        {' / '}
        <Link href={localeHref(locale, '/guides')} className="hover:text-brand">
          {t('guides.title')}
        </Link>
      </nav>

      <header className="mt-4 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">{fm.country}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{fm.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">{fm.description}</p>
        <div className="mt-4">
          <DataFreshness locale={locale} date={fm.dataCheckedAt} />
        </div>
      </header>

      <div className="mt-6 max-w-3xl">
        <ContentImage asset={hero} priority sizes="(max-width: 768px) 100vw, 768px" />
      </div>

      <div className="mt-2 max-w-3xl">
        <RenderMdx locale={locale} source={doc.body} />
        <FAQ locale={locale} items={fm.faq} />
        <SourceList locale={locale} sources={fm.sources} />
        <p className="mt-8 text-xs text-ink-soft">
          {t('guides.updated')}: {formatDate(fm.updatedAt, locale)}
        </p>
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Container>
  );
}

function buildJsonLd(locale: Locale, slug: string, fm: Frontmatter) {
  const url = `${SITE}/${locale}/guides/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: fm.title,
        description: fm.description,
        inLanguage: localeMeta[locale].bcp47,
        datePublished: fm.publishedAt,
        dateModified: fm.updatedAt,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Tripify Editorial' },
        publisher: { '@type': 'Organization', name: 'Tripify' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tripify', item: `${SITE}/${locale}` },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE}/${locale}/guides` },
          { '@type': 'ListItem', position: 3, name: fm.title, item: url },
        ],
      },
    ],
  };
}
