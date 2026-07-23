import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { isLocale, locales, localeMeta, type Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { getContentByDestination } from '@/content/loader';
import { destinations, getDestinationBySlug, type Destination } from '@/data/destinations';
import { formatDate, localeHref } from '@/lib/locale';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    destinations.map((d) => ({ locale, slug: d.locales[locale].slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const destination = getDestinationBySlug(locale, slug);
  if (!destination) return {};
  const info = destination.locales[locale];

  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `/${l}/destinations/${destination.locales[l].slug}`;
  languages['x-default'] = `/en/destinations/${destination.locales.en.slug}`;

  return {
    title: info.name,
    description: info.blurb,
    alternates: { canonical: `/${locale}/destinations/${info.slug}`, languages },
  };
}

export default async function DestinationHub({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const destination = getDestinationBySlug(locale, slug);
  if (!destination) notFound();

  const t = getTranslator(locale);
  const info = destination.locales[locale];
  const docs = getContentByDestination(locale, destination.key);
  const guides = docs.filter((d) => d.frontmatter.type === 'guide');
  const data = docs.filter((d) => d.frontmatter.type === 'data');

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { label: t('site.name'), href: localeHref(locale, '/') },
          { label: t('destinations.title'), href: localeHref(locale, '/destinations') },
          { label: info.name },
        ]}
      />

      <header className="mt-4 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {destination.country[locale]}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{info.name}</h1>
        <p className="mt-3 text-lg text-ink-soft">{info.blurb}</p>
      </header>

      {docs.length === 0 && <p className="mt-8 text-ink-soft">{t('destinations.empty')}</p>}

      {guides.length > 0 && (
        <HubSection
          heading={t('destinations.guidesHeading')}
          items={guides.map((d) => ({
            slug: d.frontmatter.slug,
            title: d.frontmatter.title,
            description: d.frontmatter.description,
            updated: d.frontmatter.updatedAt,
            href: localeHref(locale, `/guides/${d.frontmatter.slug}`),
          }))}
          updatedLabel={t('guides.updated')}
          locale={locale}
        />
      )}

      {data.length > 0 && (
        <HubSection
          heading={t('destinations.dataHeading')}
          items={data.map((d) => ({
            slug: d.frontmatter.slug,
            title: d.frontmatter.title,
            description: d.frontmatter.description,
            updated: d.frontmatter.dataCheckedAt,
            href: localeHref(locale, `/data/${d.frontmatter.slug}`),
          }))}
          updatedLabel={t('data.updated')}
          locale={locale}
        />
      )}

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(locale, destination)) }}
      />
    </Container>
  );
}

function HubSection({
  heading,
  items,
  updatedLabel,
  locale,
}: {
  heading: string;
  items: { slug: string; title: string; description: string; updated: string; href: string }[];
  updatedLabel: string;
  locale: Locale;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-ink">{heading}</h2>
      <ul className="mt-4 grid gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-brand"
            >
              <h3 className="text-base font-semibold text-ink group-hover:text-brand">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-soft">{item.description}</p>
              <span className="mt-3 text-xs text-ink-soft">
                {updatedLabel}: {formatDate(item.updated, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** `TouristDestination` + `BreadcrumbList` JSON-LD (spec §9). */
function buildJsonLd(locale: Locale, destination: Destination) {
  const info = destination.locales[locale];
  const url = `${SITE}/${locale}/destinations/${info.slug}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        name: info.name,
        description: info.blurb,
        inLanguage: localeMeta[locale].bcp47,
        url,
        addressCountry: destination.country[locale],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tripify', item: `${SITE}/${locale}` },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Destinations',
            item: `${SITE}/${locale}/destinations`,
          },
          { '@type': 'ListItem', position: 3, name: info.name, item: url },
        ],
      },
    ],
  };
}
