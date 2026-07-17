import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { parseSiteContent } from '@/lib/site/content'
import { isThemeId } from '@/lib/site/themes'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SiteRenderer, type PortfolioItem } from '@/components/site/SiteRenderer'

export const dynamic = 'force-dynamic'

interface SiteRow {
  theme: string
  mode: string
  content: unknown
  display_name: string | null
  logo_key: string | null
}

interface GalleryRow {
  slug: string
  title: string
  preview_key: string | null
}

/**
 * Published photographer site. Everything on this page belongs to the
 * photographer's brand — the platform is invisible. Data comes through
 * security-definer RPCs; media through short-lived presigned R2 URLs.
 */
export default async function PublicSitePage({
  params,
}: {
  params: { locale: string; handle: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const [{ data: siteData }, { data: galleriesData }] = await Promise.all([
    supabase.rpc('get_site', { p_handle: params.handle }),
    supabase.rpc('get_site_galleries', { p_handle: params.handle }),
  ])

  const site = (siteData as SiteRow[] | null)?.[0]
  if (!site || !isThemeId(site.theme)) notFound()

  const storage = getStorage()
  const logoUrl = site.logo_key
    ? await storage.getSignedReadUrl(site.logo_key, { expiresInSeconds: 60 * 60 })
    : null

  const portfolio: PortfolioItem[] = await Promise.all(
    ((galleriesData as GalleryRow[] | null) ?? []).map(async (gallery) => ({
      slug: gallery.slug,
      title: gallery.title,
      previewUrl: gallery.preview_key
        ? await storage.getSignedReadUrl(gallery.preview_key, { expiresInSeconds: 60 * 60 })
        : null,
      href: `/${locale}/g/${gallery.slug}`,
    }))
  )

  return (
    <SiteRenderer
      theme={site.theme}
      mode={site.mode === 'night' ? 'night' : 'light'}
      content={parseSiteContent(site.content)}
      displayName={site.display_name}
      logoUrl={logoUrl}
      portfolio={portfolio}
      labels={{
        portfolio: dict.publicSite.portfolio,
        about: dict.publicSite.about,
        pricing: dict.publicSite.pricing,
        contacts: dict.publicSite.contacts,
        openGallery: dict.publicSite.openGallery,
        book: dict.publicSite.book,
      }}
    />
  )
}
