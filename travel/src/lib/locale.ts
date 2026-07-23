import { localeMeta, type Locale } from '@/i18n/config';

/**
 * Locale-aware `Intl` helpers. Dates, numbers and currencies are always
 * formatted through these so we never ship a hardcoded `$` or `.` separator
 * (spec §4). The display currency defaults to the locale's audience currency
 * but callers may override it (e.g. a user-selected currency switcher).
 */

export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = localeMeta[locale].currency,
): string {
  return new Intl.NumberFormat(localeMeta[locale].bcp47, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeMeta[locale].bcp47).format(value);
}

export function formatDate(
  value: string | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeMeta[locale].bcp47, options).format(date);
}

/** Build a locale-prefixed href, e.g. `localeHref('de', '/guides')` → `/de/guides`. */
export function localeHref(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean === '/' ? '' : clean}`;
}
