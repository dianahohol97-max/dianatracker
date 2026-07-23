import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import '../globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { isLocale, localeMeta, locales } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';

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

  const messages = getMessages(locale);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    metadataBase: new URL(base),
    title: {
      default: `${messages.site.name} — ${messages.nav.destinations}`,
      template: `%s · ${messages.site.name}`,
    },
    description: messages.site.tagline,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const meta = localeMeta[locale];

  return (
    <html lang={meta.bcp47} dir={meta.dir}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Header locale={locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
