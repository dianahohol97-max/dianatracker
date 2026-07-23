import { compileMDX } from 'next-mdx-remote/rsc';
import type { MDXComponents } from 'mdx/types';

import type { Locale } from '@/i18n/config';
import { Callout } from '@/components/content/Callout';
import { FactBox } from '@/components/content/FactBox';
import { PriceTable, type PriceRow } from '@/components/content/PriceTable';
import { DataFreshness } from '@/components/content/DataFreshness';

/**
 * Per-locale MDX component map. Components that need localised labels get the
 * current locale baked in via closure (RSC-safe — no React context needed).
 * Authors use these tags in `.mdx` bodies without importing them.
 */
function getMdxComponents(locale: Locale): MDXComponents {
  return {
    Callout,
    FactBox: (props: Omit<Parameters<typeof FactBox>[0], 'locale'>) => (
      <FactBox locale={locale} {...props} />
    ),
    PriceTable: (props: {
      caption?: string;
      rows: PriceRow[];
      checkedAt: string;
      approximate?: boolean;
    }) => <PriceTable locale={locale} {...props} />,
    DataFreshness: (props: { date: string }) => <DataFreshness locale={locale} {...props} />,
    // Base typography — spacing/anchors for author-written markdown.
    h2: (props) => <h2 className="mt-10 text-2xl font-bold text-ink" {...props} />,
    h3: (props) => <h3 className="mt-6 text-xl font-semibold text-ink" {...props} />,
    p: (props) => <p className="mt-4 leading-7 text-ink" {...props} />,
    ul: (props) => <ul className="mt-4 list-disc space-y-1 pl-6 text-ink" {...props} />,
    ol: (props) => <ol className="mt-4 list-decimal space-y-1 pl-6 text-ink" {...props} />,
    a: (props) => <a className="text-brand underline hover:no-underline" {...props} />,
    table: (props) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="border-b border-line bg-paper-muted px-3 py-2 text-left font-semibold" {...props} />
    ),
    td: (props) => <td className="border-b border-line px-3 py-2" {...props} />,
  };
}

/** Compile an MDX body to a React node with the locale's component map. */
export async function RenderMdx({ locale, source }: { locale: Locale; source: string }) {
  const { content } = await compileMDX({
    source,
    components: getMdxComponents(locale),
    options: { parseFrontmatter: false },
  });
  return content;
}
