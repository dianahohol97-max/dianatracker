import Link from 'next/link'
import type { Block } from '@/lib/blog/articles'

/** Renders an article's structured blocks into clean, readable prose. */
export function ArticleBody({ blocks, locale }: { blocks: Block[]; locale: string }) {
  return (
    <div className="mt-8 flex flex-col gap-5">
      {blocks.map((block, index) => {
        if (block.type === 'h2') {
          return (
            <h2 key={index} className="mt-4 font-display text-2xl">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={index} className="flex list-none flex-col gap-2 pl-1">
              {block.items.map((item, i) => (
                <li key={i} className="leading-relaxed text-muted">
                  <span className="text-accent">—</span> {item}
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'cta') {
          const href = block.href.startsWith('/')
            ? `/${locale}${block.href.replace(/^\/[a-z]{2}(?=\/|$)/, '')}`
            : block.href
          return (
            <div key={index} className="mt-4">
              <Link
                href={href}
                className="inline-block rounded-full bg-accent px-7 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-accent-deep"
              >
                {block.text}
              </Link>
            </div>
          )
        }
        return (
          <p key={index} className="leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
