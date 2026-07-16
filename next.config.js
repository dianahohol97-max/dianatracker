/** @type {import('next').NextConfig} */
const nextConfig = {
  // Originals and previews are served straight from R2 via presigned URLs —
  // never proxied through Next/Vercel (egress cost). Image optimization is
  // deliberately disabled until an image CDN (Bunny Optimizer / Cloudflare
  // Images) is wired in via the custom loader in src/lib/images/loader.ts.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
