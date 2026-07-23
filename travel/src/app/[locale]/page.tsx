import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/Container';
import { DestinationCard } from '@/components/DestinationCard';
import { Newsletter } from '@/components/Newsletter';
import { isLocale } from '@/i18n/config';
import { getMessages, getTranslator } from '@/i18n/messages';
import { getContentByType } from '@/content/loader';
import { destinations } from '@/data/destinations';
import { formatDate, localeHref } from '@/lib/locale';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getTranslator(locale);
  const messages = getMessages(locale);
  const guides = getContentByType(locale, 'guide')
    .sort((a, b) => (a.frontmatter.updatedAt < b.frontmatter.updatedAt ? 1 : -1))
    .slice(0, 3);

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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={localeHref(locale, '/destinations')}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                {t('nav.destinations')}
              </Link>
              <Link
                href={localeHref(locale, '/guides')}
                className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {t('nav.guides')}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Top destinations */}
      <Container className="py-14">
        <SectionHeader
          title={t('home.topDestinations')}
          href={localeHref(locale, '/destinations')}
          seeAll={t('home.seeAll')}
        />
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <li key={destination.key}>
              <DestinationCard locale={locale} destination={destination} />
            </li>
          ))}
        </ul>
      </Container>

      {/* Latest guides */}
      {guides.length > 0 && (
        <Container className="py-4 pb-14">
          <SectionHeader
            title={t('home.latestGuides')}
            href={localeHref(locale, '/guides')}
            seeAll={t('home.seeAll')}
          />
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map(({ frontmatter: fm }) => (
              <li key={fm.slug}>
                <Link
                  href={localeHref(locale, `/guides/${fm.slug}`)}
                  className="group flex h-full flex-col rounded-xl border border-line bg-paper p-5 transition-colors hover:border-brand"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {fm.country}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-ink group-hover:text-brand">
                    {fm.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-soft">{fm.description}</p>
                  <span className="mt-3 text-xs text-ink-soft">
                    {t('guides.updated')}: {formatDate(fm.updatedAt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* Newsletter */}
      <Container className="pb-16">
        <Newsletter
          locale={locale}
          strings={{
            title: messages.newsletter.title,
            subtitle: messages.newsletter.subtitle,
            placeholder: messages.newsletter.placeholder,
            submit: messages.newsletter.submit,
            consent: messages.newsletter.consent,
          }}
        />
      </Container>
    </>
  );
}

function SectionHeader({
  title,
  href,
  seeAll,
}: {
  title: string;
  href: string;
  seeAll: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
      <Link href={href} className="text-sm font-medium text-brand hover:underline">
        {seeAll} →
      </Link>
    </div>
  );
}
