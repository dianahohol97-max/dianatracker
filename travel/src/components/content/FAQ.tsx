import type { Locale } from '@/i18n/config';
import type { FaqItem } from '@/content/schema';
import { getTranslator } from '@/i18n/messages';

/**
 * FAQ accordion + `FAQPage` JSON-LD (spec §7, §9).
 *
 * Uses native `<details>`/`<summary>` so it is accessible and fully functional
 * with zero client JS (better INP/CLS). The JSON-LD mirrors the rendered items
 * so answers are eligible for rich results.
 */
export function FAQ({
  locale,
  items,
  heading,
}: {
  locale: Locale;
  items: FaqItem[];
  heading?: string;
}) {
  const t = getTranslator(locale);
  if (items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-ink">{heading ?? t('faq.title')}</h2>
      <div className="mt-4 divide-y divide-line rounded-xl border border-line">
        {items.map((item) => (
          <details key={item.question} className="group px-4 py-3 [&_summary]:list-none">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-ink">
              {item.question}
              <span
                aria-hidden
                className="text-ink-soft transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-sm text-ink-soft">{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
