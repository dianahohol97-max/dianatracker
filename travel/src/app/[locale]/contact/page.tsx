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
    title: t('contact.title'),
    description: t('contact.body').slice(0, 155),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}/contact`])),
        'x-default': '/en/contact',
      },
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslator(locale);
  const email = t('contact.email');
  return (
    <Container className="py-12">
      <article className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t('contact.title')}</h1>
        <p className="mt-4 text-ink-soft">{t('contact.body')}</p>
        <a
          href={`mailto:${email}`}
          className="mt-6 inline-block font-medium text-brand hover:underline"
        >
          {email}
        </a>
      </article>
    </Container>
  );
}
