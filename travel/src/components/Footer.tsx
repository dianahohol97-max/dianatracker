import Link from 'next/link';

import { Container } from './Container';
import type { Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { localeHref } from '@/lib/locale';

export function Footer({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);
  const year = new Date().getFullYear();

  const explore = [
    { href: '/destinations', label: t('nav.destinations') },
    { href: '/guides', label: t('nav.guides') },
    { href: '/tools', label: t('nav.tools') },
  ];
  const company = [
    { href: '/about', label: t('footer.links.about') },
    { href: '/contact', label: t('footer.links.contact') },
  ];
  const legal = [
    { href: '/affiliate-disclosure', label: t('footer.links.affiliateDisclosure') },
    { href: '/privacy', label: t('footer.links.privacy') },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-paper-muted">
      <Container className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-semibold text-ink">{t('site.name')}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">{t('site.tagline')}</p>
        </div>

        <FooterColumn title={t('footer.sections.explore')} links={explore} locale={locale} />
        <FooterColumn title={t('footer.sections.company')} links={company} locale={locale} />
        <FooterColumn title={t('footer.sections.legal')} links={legal} locale={locale} />
      </Container>

      <Container className="border-t border-line py-6">
        <p className="text-xs text-ink-soft">{t('footer.disclosureShort')}</p>
        <p className="mt-2 text-xs text-ink-soft">
          © {year} {t('site.name')}. {t('footer.rights')}
        </p>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  locale,
}: {
  title: string;
  links: { href: string; label: string }[];
  locale: Locale;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={localeHref(locale, link.href)}
              className="text-sm text-ink-soft transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
