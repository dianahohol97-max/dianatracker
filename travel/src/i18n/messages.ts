import 'server-only';

import type { Locale } from './config';

/**
 * Server-side UI string loader.
 *
 * Messages live in `/messages/{locale}.json` — no text is hardcoded in
 * components (spec §4). We import the JSON statically so the bundler can
 * tree-shake and so a missing file is a build error, not a runtime 404.
 */
import en from '../../messages/en.json';
import de from '../../messages/de.json';
import pl from '../../messages/pl.json';
import uk from '../../messages/uk.json';

export type Messages = typeof en;

const dictionaries: Record<Locale, Messages> = {
  en: en as Messages,
  de: de as Messages,
  pl: pl as Messages,
  uk: uk as Messages,
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

/**
 * Resolve a dotted key path (`"nav.guides"`) against a locale's messages,
 * falling back to English, then to the raw key. Keeps components terse:
 *   const t = getTranslator(locale); t('nav.guides')
 */
export function getTranslator(locale: Locale) {
  const dict = dictionaries[locale];
  const fallback = dictionaries.en;

  return function t(key: string): string {
    return resolve(dict, key) ?? resolve(fallback, key) ?? key;
  };
}

function resolve(dict: Messages, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in (acc as object)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, dict);

  return typeof value === 'string' ? value : undefined;
}
