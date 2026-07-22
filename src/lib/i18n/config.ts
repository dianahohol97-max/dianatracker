// Ukrainian and English are fully translated (platform + client pages).
// The rest are CLIENT-facing languages: their dictionaries translate only the
// public gallery / booking / site strings and fall back to English elsewhere
// (see getDictionary). Adding a language = one dictionary file + a code here.
export const locales = ['uk', 'en', 'pl', 'de', 'es', 'fr', 'it', 'ro', 'pt'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'uk'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
