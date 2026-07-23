/**
 * check:i18n — CI guard for locale parity.
 *
 * Phase 1: verifies every locale in `/messages` has the exact same set of
 * translation keys as the default locale (`en`). Missing or extra keys fail
 * the build. Phase 2 extends this to also report incomplete `translationKey`
 * links across content files.
 *
 * Run: npm run check:i18n
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(here, '..', 'messages');

const locales = ['en', 'de', 'pl', 'uk'] as const;
const referenceLocale = 'en';

type Json = Record<string, unknown>;

function load(locale: string): Json {
  return JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8')) as Json;
}

/** Flatten nested keys into dotted paths: { a: { b: 1 } } → ["a.b"]. */
function flatten(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value as Json, path)
      : [path];
  });
}

function main(): void {
  const reference = new Set(flatten(load(referenceLocale)));
  let failed = false;

  for (const locale of locales) {
    if (locale === referenceLocale) continue;
    const keys = new Set(flatten(load(locale)));

    const missing = [...reference].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !reference.has(k));

    if (missing.length || extra.length) {
      failed = true;
      console.error(`\n✗ ${locale}.json out of sync with ${referenceLocale}.json`);
      if (missing.length) console.error(`  missing keys:\n    ${missing.join('\n    ')}`);
      if (extra.length) console.error(`  extra keys:\n    ${extra.join('\n    ')}`);
    } else {
      console.log(`✓ ${locale}.json — ${keys.size} keys, in parity`);
    }
  }

  if (failed) {
    console.error('\ni18n check failed.\n');
    process.exit(1);
  }
  console.log('\nAll locales in parity.\n');
}

main();
