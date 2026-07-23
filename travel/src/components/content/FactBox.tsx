import type { Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';

/**
 * Quick-facts box shown near the top of a guide (spec §7): when to go, budget,
 * duration, how to get there. Labels are localised; values are authored per
 * locale in the MDX file.
 */
export function FactBox({
  locale,
  whenToGo,
  budget,
  duration,
  gettingThere,
}: {
  locale: Locale;
  whenToGo: string;
  budget: string;
  duration: string;
  gettingThere: string;
}) {
  const t = getTranslator(locale);
  const rows = [
    { label: t('factBox.whenToGo'), value: whenToGo },
    { label: t('factBox.budget'), value: budget },
    { label: t('factBox.duration'), value: duration },
    { label: t('factBox.gettingThere'), value: gettingThere },
  ];

  return (
    <div className="my-8 rounded-xl border border-line bg-paper-muted p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {t('factBox.title')}
      </p>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
