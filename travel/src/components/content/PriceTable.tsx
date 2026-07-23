import type { Locale } from '@/i18n/config';
import { getTranslator } from '@/i18n/messages';
import { formatDate } from '@/lib/locale';

export interface PriceRow {
  item: string;
  price: string;
  /** Optional note, e.g. "official site" or "peak season". */
  note?: string;
}

/**
 * Price table with a mandatory "checked on" date and an optional "approximate"
 * flag (spec §7 / editorial standard §1: no numbers without a check date; when
 * a price is uncertain it is labelled orientative, never presented as exact).
 */
export function PriceTable({
  locale,
  caption,
  rows,
  checkedAt,
  approximate = false,
}: {
  locale: Locale;
  caption?: string;
  rows: PriceRow[];
  checkedAt: string;
  approximate?: boolean;
}) {
  const t = getTranslator(locale);

  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          {caption && (
            <caption className="px-4 pt-4 text-left text-base font-semibold text-ink">
              {caption}
            </caption>
          )}
          <thead>
            <tr className="border-b border-line bg-paper-muted text-left">
              <th scope="col" className="px-4 py-2.5 font-semibold text-ink">
                {t('priceTable.item')}
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold text-ink">
                {t('priceTable.price')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">
                  {row.item}
                  {row.note && <span className="block text-xs text-ink-soft">{row.note}</span>}
                </td>
                <td className="px-4 py-2.5 font-medium text-ink">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-xs text-ink-soft">
        {approximate && (
          <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700">
            {t('priceTable.approximate')}
          </span>
        )}
        {t('common.dataChecked')}: {formatDate(checkedAt, locale)}
      </figcaption>
    </figure>
  );
}
