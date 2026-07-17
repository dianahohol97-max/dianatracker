import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Galleries (/g) and booking (/b) are NOT disallowed here on purpose: they
 * carry meta noindex, and a crawler must be able to fetch the page to see it.
 * robots.txt-blocked URLs can still end up indexed from external links.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/uk/dashboard',
          '/en/dashboard',
          '/uk/login',
          '/en/login',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
