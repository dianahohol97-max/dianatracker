/**
 * i18n configuration — single source of truth for locales.
 *
 * Rules (from the editorial/product spec):
 *  - Four locales at full parity: en, de, pl, uk.
 *  - Default locale is `en`; every route is prefixed (`/en`, `/de`, ...).
 *  - NO automatic IP / Accept-Language redirect. The default is always `en`.
 *  - Each locale carries its own currency + Intl formatting hints.
 */

export const locales = ['en', 'de', 'pl', 'uk'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Per-locale presentation metadata used across UI + `Intl` formatters. */
export interface LocaleMeta {
  /** BCP-47 tag for `Intl` and the `<html lang>` attribute. */
  readonly bcp47: string;
  /** Native language name shown in the switcher. */
  readonly label: string;
  /** Default display currency for this audience (user can override). */
  readonly currency: string;
  /** Text direction — all four current locales are LTR. */
  readonly dir: 'ltr' | 'rtl';
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { bcp47: 'en', label: 'English', currency: 'USD', dir: 'ltr' },
  de: { bcp47: 'de', label: 'Deutsch', currency: 'EUR', dir: 'ltr' },
  pl: { bcp47: 'pl', label: 'Polski', currency: 'PLN', dir: 'ltr' },
  uk: { bcp47: 'uk', label: 'Українська', currency: 'UAH', dir: 'ltr' },
};
