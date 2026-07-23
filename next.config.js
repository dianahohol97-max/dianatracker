/** @type {import('next').NextConfig} */
const nextConfig = {
  // Originals and previews are served straight from R2 via presigned URLs —
  // never proxied through Next/Vercel (egress cost). Image optimization is
  // deliberately disabled until an image CDN (Bunny Optimizer / Cloudflare
  // Images) is wired in via the custom loader in src/lib/images/loader.ts.
  images: {
    unoptimized: true,
  },
  // The photographer-site OG image reads brand .ttf fonts from disk at render
  // time; make sure Vercel's function bundle includes them. (Next 14 nests this
  // under `experimental`; it graduates to top-level in Next 15.)
  experimental: {
    outputFileTracingIncludes: {
      '/[locale]/s/[handle]/opengraph-image': ['./src/assets/fonts/**'],
    },
  },
}

module.exports = nextConfig
