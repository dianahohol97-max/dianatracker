import type { Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { formatDate } from '@/lib/locale';

/** "Data checked {date}" badge (spec §7). */
export function DataFreshness({ locale, date }: { locale: Locale; date: string }) {
  const t = getTranslator(locale);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft/40 px-3 py-1 text-xs font-medium text-brand-dark">
      <span aria-hidden>✓</span>
      {t('common.dataChecked')}: {formatDate(date, locale)}
    </span>
  );
}
