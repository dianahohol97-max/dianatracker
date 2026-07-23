/**
 * check:content — validates every MDX content file and reports translationKey
 * parity gaps across locales.
 *
 * Two guarantees:
 *  1. Every content file's frontmatter passes the Zod schema (spec §2) — bad
 *     metadata fails CI, not just the runtime build.
 *  2. Every `translationKey` exists in ALL four locales (full parity, spec §4).
 *     Missing translations are reported (warning by default, error with
 *     --strict) so we can see the content coverage matrix at a glance.
 *
 * Run: npm run check:content [-- --strict]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import matter from 'gray-matter';

import { frontmatterSchema, contentTypes, type ContentType } from '../src/content/schema';
import { locales } from '../src/i18n/config';

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = join(here, '..', 'content');
const strict = process.argv.includes('--strict');

const typeDir: Record<ContentType, string> = {
  guide: 'guides',
  data: 'data',
  destination: 'destinations',
  comparison: 'comparisons',
  itinerary: 'itineraries',
};

interface Entry {
  locale: string;
  type: ContentType;
  translationKey: string;
  file: string;
}

function main(): void {
  const entries: Entry[] = [];
  let hadError = false;

  for (const locale of locales) {
    for (const type of contentTypes) {
      const dir = join(CONTENT_ROOT, locale, typeDir[type]);
      if (!existsSync(dir)) continue;

      for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
        const rel = `content/${locale}/${typeDir[type]}/${file}`;
        const { data } = matter(readFileSync(join(dir, file), 'utf8'));
        const parsed = frontmatterSchema.safeParse(data);

        if (!parsed.success) {
          hadError = true;
          console.error(`✗ ${rel}`);
          for (const issue of parsed.error.issues) {
            console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`);
          }
          continue;
        }
        if (parsed.data.locale !== locale) {
          hadError = true;
          console.error(`✗ ${rel}: frontmatter locale "${parsed.data.locale}" ≠ folder "${locale}"`);
          continue;
        }
        entries.push({ locale, type, translationKey: parsed.data.translationKey, file: rel });
      }
    }
  }

  console.log(`\nValidated ${entries.length} content file(s).`);

  // Parity matrix: every (type, translationKey) should exist in all locales.
  const groups = new Map<string, Set<string>>();
  for (const e of entries) {
    const key = `${e.type}:${e.translationKey}`;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key)!.add(e.locale);
  }

  let parityGaps = 0;
  for (const [key, present] of groups) {
    const missing = locales.filter((l) => !present.has(l));
    if (missing.length) {
      parityGaps++;
      console.warn(`  ⚠ ${key} — missing locales: ${missing.join(', ')}`);
    }
  }

  if (parityGaps === 0 && groups.size > 0) {
    console.log(`All ${groups.size} translationKey group(s) have full 4-locale parity.`);
  }

  if (hadError || (strict && parityGaps > 0)) {
    console.error('\ncontent check failed.\n');
    process.exit(1);
  }
  console.log('');
}

main();
