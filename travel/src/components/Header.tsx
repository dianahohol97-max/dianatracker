import Link from 'next/link';

import { Container } from './Container';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { localeHref } from '@/lib/locale';

export function Header({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);

  const nav = [
    { href: '/destinations', label: t('nav.destinations') },
    { href: '/guides', label: t('nav.guides') },
    { href: '/tools', label: t('nav.tools') },
    { href: '/about', label: t('nav.about') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link
          href={localeHref(locale, '/')}
          className="text-lg font-semibold tracking-tight text-ink"
        >
          {t('site.name')}
        </Link>

        <nav aria-label={t('nav.destinations')} className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localeHref(locale, item.href)}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <LanguageSwitcher locale={locale} />
      </Container>
    </header>
  );
}
