import 'server-only';

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import matter from 'gray-matter';

import { locales, type Locale } from '@/i18n/config';
import { frontmatterSchema, type ContentType, type Frontmatter } from './schema';

/**
 * Filesystem content loader.
 *
 * Content lives at `/content/{locale}/{typeDir}/{file}.mdx`. Each file is
 * parsed with gray-matter, its frontmatter validated against the Zod schema
 * (invalid = thrown build error), and returned as a typed `ContentDoc`. Draft
 * documents are excluded outside development.
 *
 * Reads are cached per-process so the same file is parsed once per build.
 */

export interface ContentDoc {
  readonly frontmatter: Frontmatter;
  /** Raw MDX body (frontmatter stripped) — compiled at render time. */
  readonly body: string;
}

/** Maps a content type to its on-disk directory. */
const typeDir: Record<ContentType, string> = {
  guide: 'guides',
  data: 'data',
  destination: 'destinations',
  comparison: 'comparisons',
  itinerary: 'itineraries',
};

const CONTENT_ROOT = join(process.cwd(), 'content');
const isDev = process.env.NODE_ENV !== 'production';

let cache: ContentDoc[] | null = null;

function loadAll(): ContentDoc[] {
  if (cache) return cache;

  const docs: ContentDoc[] = [];

  for (const locale of locales) {
    for (const type of Object.keys(typeDir) as ContentType[]) {
      const dir = join(CONTENT_ROOT, locale, typeDir[type]);
      if (!existsSync(dir)) continue;

      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.mdx')) continue;

        const raw = readFileSync(join(dir, file), 'utf8');
        const { data, content } = matter(raw);

        const parsed = frontmatterSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(
            `Invalid frontmatter in content/${locale}/${typeDir[type]}/${file}:\n` +
              parsed.error.issues
                .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
                .join('\n'),
          );
        }

        // Cross-check: on-disk locale/type must match the declared frontmatter.
        if (parsed.data.locale !== locale) {
          throw new Error(
            `Locale mismatch in content/${locale}/.../${file}: frontmatter says "${parsed.data.locale}"`,
          );
        }
        if (parsed.data.type !== type) {
          throw new Error(
            `Type mismatch in content/${locale}/${typeDir[type]}/${file}: frontmatter says "${parsed.data.type}"`,
          );
        }

        docs.push({ frontmatter: parsed.data, body: content });
      }
    }
  }

  cache = docs;
  return docs;
}

function visible(doc: ContentDoc): boolean {
  return isDev || !doc.frontmatter.draft;
}

/** All non-draft docs (drafts included in dev). */
export function getAllContent(): ContentDoc[] {
  return loadAll().filter(visible);
}

export function getContentByType(locale: Locale, type: ContentType): ContentDoc[] {
  return getAllContent().filter(
    (d) => d.frontmatter.locale === locale && d.frontmatter.type === type,
  );
}

export function getContentBySlug(
  locale: Locale,
  type: ContentType,
  slug: string,
): ContentDoc | undefined {
  return getAllContent().find(
    (d) =>
      d.frontmatter.locale === locale &&
      d.frontmatter.type === type &&
      d.frontmatter.slug === slug,
  );
}

/**
 * All locale variants sharing a `translationKey`, keyed by locale. Powers
 * hreflang alternates and the language switcher: given the current doc, we can
 * resolve the translated slug for every other locale.
 */
export function getTranslations(translationKey: string): Partial<Record<Locale, ContentDoc>> {
  const out: Partial<Record<Locale, ContentDoc>> = {};
  for (const doc of getAllContent()) {
    if (doc.frontmatter.translationKey === translationKey) {
      out[doc.frontmatter.locale] = doc;
    }
  }
  return out;
}

/** Build-time helper: every distinct (type, translationKey) pair. */
export function getAllTranslationKeys(): { type: ContentType; translationKey: string }[] {
  const seen = new Set<string>();
  const out: { type: ContentType; translationKey: string }[] = [];
  for (const doc of loadAll()) {
    const key = `${doc.frontmatter.type}:${doc.frontmatter.translationKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ type: doc.frontmatter.type, translationKey: doc.frontmatter.translationKey });
    }
  }
  return out;
}
