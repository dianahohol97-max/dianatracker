/**
 * Blog content — Ukrainian SEO articles, stored as structured blocks (no MDX
 * tooling, no DB). Add an article by appending to ARTICLES. The pages render
 * from here and pull metadata / JSON-LD off the same objects.
 */

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'cta'; text: string; href: string }

export interface Article {
  slug: string
  title: string
  description: string
  /** ISO date (published / last meaningful update). */
  date: string
  readingMinutes: number
  tags: string[]
  body: Block[]
}

/**
 * Articles, newest first. Content is Ukrainian (the launch market); the blog
 * canonicalizes to /uk/blog regardless of the route locale.
 */
export const ARTICLES: Article[] = []

export function getArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null
}
