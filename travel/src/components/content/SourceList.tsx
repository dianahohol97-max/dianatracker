import type { Locale } from '@/i18n/config';
import type { Source } from '@/content/schema';
import { getTranslator } from '@/i18n/messages';
import { formatDate } from '@/lib/locale';

/**
 * List of verified sources with check dates (spec §7 / editorial standard).
 * Rendered from frontmatter `sources`. External links are safe-rel'd.
 */
export function SourceList({ locale, sources }: { locale: Locale; sources: Source[] }) {
  const t = getTranslator(locale);
  if (sources.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-line bg-paper-muted p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {t('common.sources')}
      </h2>
      <ol className="mt-3 space-y-2">
        {sources.map((source) => (
          <li key={source.url} className="text-sm">
            <a
              href={source.url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-medium text-brand hover:underline"
            >
              {source.title}
            </a>
            <span className="ml-2 text-xs text-ink-soft">
              {t('common.dataChecked')}: {formatDate(source.checkedAt, locale)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
