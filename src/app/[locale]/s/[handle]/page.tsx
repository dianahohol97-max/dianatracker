import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { localizedSiteContent, parseSiteContent } from '@/lib/site/content'
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

interface PortfolioRow {
  id: string
  preview_key: string | null
  category: string | null
}

/**
 * Photographer sites ARE meant to rank (unlike client galleries): the title
 * and description come from the photographer's own content, and — true to
 * the zero-branding principle — the platform's title template is escaped
 * with an absolute title, so «проЯв» never appears in their tab or snippet.
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; handle: string }
}): Promise<Metadata> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.rpc('get_site', { p_handle: params.handle })
  const site = (data as SiteRow[] | null)?.[0]
  if (!site) return { robots: { index: false, follow: false } }

  const content = localizedSiteContent(parseSiteContent(site.content), params.locale)
  const title = content.hero.title || site.display_name || params.handle
  const description =
    (content.about.text || content.hero.subtitle || title).replace(/\s+/g, ' ').slice(0, 160)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${params.locale}/s/${params.handle}` },
    openGraph: { type: 'website', title, description },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  }
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
  const [{ data: siteData }, { data: portfolioData }] = await Promise.all([
    supabase.rpc('get_site', { p_handle: params.handle }),
    supabase.rpc('get_site_portfolio', { p_handle: params.handle }),
  ])

  const site = (siteData as SiteRow[] | null)?.[0]
  if (!site || !isThemeId(site.theme)) notFound()

  const storage = getStorage()
  const logoUrl = site.logo_key
    ? await storage.getSignedReadUrl(site.logo_key, { expiresInSeconds: 60 * 60 })
    : null

  const portfolio: PortfolioItem[] = await Promise.all(
    ((portfolioData as PortfolioRow[] | null) ?? []).map(async (row) => ({
      id: row.id,
      previewUrl: row.preview_key
        ? await storage.getSignedReadUrl(row.preview_key, { expiresInSeconds: 60 * 60 })
        : null,
      category: row.category,
    }))
  )

  // Structured data for the PHOTOGRAPHER (their business, not ours).
  const rawContent = parseSiteContent(site.content)
  const content = localizedSiteContent(rawContent, locale)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.display_name ?? content.hero.title,
    description: content.about.text || content.hero.subtitle || undefined,
    email: content.contact.email || undefined,
    telephone: content.contact.phone || undefined,
    sameAs: content.contact.instagram
      ? [`https://instagram.com/${content.contact.instagram.replace(/^@/, '')}`]
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteRenderer
        theme={site.theme}
        mode={site.mode === 'night' ? 'night' : 'light'}
        content={content}
        displayName={site.display_name}
        logoUrl={logoUrl}
        portfolio={portfolio}
        labels={{
          portfolio: dict.publicSite.portfolio,
          about: dict.publicSite.about,
          pricing: dict.publicSite.pricing,
          contacts: dict.publicSite.contacts,
          book: dict.publicSite.book,
        }}
        langSwitch={
          rawContent.settings.bilingual
            ? {
                current: locale === 'en' ? 'en' : 'uk',
                hrefUk: `/uk/s/${params.handle}`,
                hrefEn: `/en/s/${params.handle}`,
              }
            : undefined
        }
        leadForm={
          rawContent.settings.leadForm
            ? {
                handle: params.handle,
                labels: {
                  title: dict.publicSite.leadTitle,
                  name: dict.publicSite.leadName,
                  contact: dict.publicSite.leadContact,
                  message: dict.publicSite.leadMessage,
                  send: dict.publicSite.leadSend,
                  sent: dict.publicSite.leadSent,
                  error: dict.publicSite.leadError,
                },
              }
            : undefined
        }
      />
    </>
  )
}
