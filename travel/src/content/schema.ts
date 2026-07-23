import { z } from 'zod';

import { locales } from '../i18n/config';

/**
 * Frontmatter schema (spec §2). Every MDX content file is validated against
 * this at load time — an invalid file throws and fails the build, so bad
 * metadata can never ship. The editorial standard (spec §1) is encoded here:
 * `sources` and `dataCheckedAt` are REQUIRED on every document, because every
 * factual page must be traceable to a checked source.
 */

export const contentTypes = [
  'guide',
  'data',
  'destination',
  'comparison',
  'itinerary',
] as const;

export type ContentType = (typeof contentTypes)[number];

/**
 * ISO date (YYYY-MM-DD). YAML auto-parses unquoted dates into JS `Date`
 * objects, so we coerce those back to a date string before validating — the
 * canonical stored form is always the string.
 */
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date (YYYY-MM-DD)')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Not a real calendar date'),
);

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  checkedAt: isoDate,
});

const imageCreditSchema = z.object({
  author: z.string().min(1),
  source: z.string().min(1),
  url: z.string().url(),
});

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const frontmatterSchema = z.object({
  /** Identical across all four locales — builds hreflang + the language switcher. */
  translationKey: z.string().min(1),
  title: z.string().min(1),
  /** Meta description: kept in the SEO-friendly 140–160 char window. */
  description: z.string().min(140).max(160),
  /** Localised, natural slug — never a transliteration (spec §13). */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case, lowercase'),
  locale: z.enum(locales),
  type: z.enum(contentTypes),
  country: z.string().min(1),
  region: z.string().min(1),
  publishedAt: isoDate,
  updatedAt: isoDate,
  /** When the facts on the page were last verified against sources. */
  dataCheckedAt: isoDate,
  /** At least one source is mandatory — no unsourced factual pages. */
  sources: z.array(sourceSchema).min(1),
  /**
   * Hero image is optional: a guide may be authored before a licensed photo is
   * sourced, in which case the image layer renders a placeholder (never an
   * AI photo of a real place, never a fabricated credit). When a real image is
   * set, `imageCredit` must accompany it.
   */
  heroImage: z.string().min(1).optional(),
  heroImageAlt: z.string().min(1),
  imageCredit: imageCreditSchema.optional(),
  tags: z.array(z.string().min(1)).default([]),
  faq: z.array(faqItemSchema).default([]),
  affiliateBlocks: z.array(z.string().min(1)).default([]),
  draft: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // External (remote) hero images must carry attribution.
  if (data.heroImage?.startsWith('http') && !data.imageCredit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imageCredit'],
      message: 'A remote heroImage requires imageCredit (author/source/url).',
    });
  }
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
