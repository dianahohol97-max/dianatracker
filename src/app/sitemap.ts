import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Marketing pages only. Photographer SITES (/s/<handle>) are indexable via
 * their own meta tags but are user content — a dynamic sitemap segment for
 * them is a follow-up once there is a public listing policy. Galleries and
 * booking pages are deliberately NOT here (noindex — client privacy).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { uk: `${BASE_URL}/uk`, en: `${BASE_URL}/en` }
  return [
    {
      url: `${BASE_URL}/uk`,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${BASE_URL}/en`,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages },
    },
  ]
}
