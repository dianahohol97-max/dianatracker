import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { saveSite } from '@/lib/actions/site'
import { SiteLeads } from '@/components/site-editor/SiteLeads'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { parseSiteContent } from '@/lib/site/content'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { SiteEditor } from '@/components/site-editor/SiteEditor'
import type { PortfolioItem } from '@/components/site/SiteRenderer'

export const dynamic = 'force-dynamic'

interface SiteRow {
  handle: string | null
  theme: string
  mode: string
  is_published: boolean
  content: unknown
}

interface PortfolioRow {
  id: string
  r2_key: string
  variants: Record<string, string>
  visible: boolean
  category: string | null
  caption: string | null
}

export default async function SiteEditorPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [{ data: site }, { data: profile }, { data: portfolioRows }, { data: leadRows }] =
    await Promise.all([
      supabase
        .from('sites')
        .select('handle, theme, mode, is_published, content')
        .eq('user_id', user.id)
        .maybeSingle<SiteRow>(),
      supabase
        .from('profiles')
        .select('display_name, logo_url')
        .eq('user_id', user.id)
        .single<{ display_name: string | null; logo_url: string | null }>(),
      supabase
        .from('portfolio_assets')
        .select('id, r2_key, variants, visible, category, caption')
        .eq('owner_id', user.id)
        .order('position')
        .order('created_at')
        .returns<PortfolioRow[]>(),
      supabase
        .from('site_leads')
        .select('id, name, contact, message, created_at')
        .eq('site_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

  const storage = getStorage()
  const logoUrl = profile?.logo_url
    ? await storage.getSignedReadUrl(profile.logo_url, { expiresInSeconds: 60 * 60 })
    : null
  const portfolio: PortfolioItem[] = await Promise.all(
    (portfolioRows ?? []).map(async (row) => ({
      id: row.id,
      previewUrl: await storage.getSignedReadUrl(
        row.variants.thumb ?? row.variants.preview ?? row.r2_key,
        { expiresInSeconds: 60 * 60 }
      ),
      visible: row.visible,
      category: row.category,
      caption: row.caption,
    }))
  )

  const content = parseSiteContent(site?.content)
  const currentCatalogValue =
    site?.theme === 'tysha' && site.mode === 'night' ? 'opivnich' : (site?.theme ?? 'tysha')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicUrl =
    site?.is_published && site.handle ? `${appUrl}/${locale}/s/${site.handle}` : null

  const themeNames: Record<string, string> = {
    tysha: dict.site.themeTysha,
    opivnich: dict.site.themeOpivnich,
    povitria: dict.site.themePovitria,
    plivka: dict.site.themePlivka,
    zhurnal: dict.site.themeZhurnal,
    galereia: dict.site.themeGalereia,
    arkhiv: dict.site.themeArkhiv,
    prodakshn: dict.site.themeProdakshn,
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <Link href={`/${locale}/dashboard`} className="text-sm text-muted hover:text-fg">
        ← {dict.dashboard.title}
      </Link>
      <h1 className="mb-2 mt-5 font-brand text-3xl">{dict.site.title}</h1>
      <p className="mb-2 max-w-2xl text-sm leading-relaxed text-muted">{dict.site.intro}</p>
      {publicUrl && (
        <p className="mb-6 break-all text-sm text-muted">
          {dict.site.publicLink}: {publicUrl}
        </p>
      )}

      <SiteEditor
        locale={locale}
        action={saveSite.bind(null, locale)}
        initialHandle={site?.handle ?? ''}
        initialCatalogValue={currentCatalogValue}
        initialPublished={site?.is_published ?? false}
        content={content}
        displayName={profile?.display_name ?? null}
        logoUrl={logoUrl}
        portfolio={portfolio}
        siteLabels={{
          portfolio: dict.publicSite.portfolio,
          about: dict.publicSite.about,
          pricing: dict.publicSite.pricing,
          contacts: dict.publicSite.contacts,
          book: dict.publicSite.book,
        }}
        leadFormLabels={{
          title: dict.publicSite.leadTitle,
          name: dict.publicSite.leadName,
          contact: dict.publicSite.leadContact,
          message: dict.publicSite.leadMessage,
          send: dict.publicSite.leadSend,
          sent: dict.publicSite.leadSent,
          error: dict.publicSite.leadError,
        }}
        labels={{
          publish: dict.site.publish,
          handleLabel: dict.site.handleLabel,
          handleHint: dict.site.handleHint,
          themeLabel: dict.site.themeLabel,
          themeNames,
          heroLegend: dict.site.heroLegend,
          heroTitle: dict.site.heroTitle,
          heroSubtitle: dict.site.heroSubtitle,
          portfolioLegend: dict.site.portfolioLegend,
          portfolioHint: dict.site.portfolioHint,
          portfolioUpload: dict.site.portfolioUpload,
          portfolioUploading: dict.site.portfolioUploading,
          portfolioManageHint: dict.site.portfolioManageHint,
          portfolioDragHint: dict.site.portfolioDragHint,
          portfolioHiddenBadge: dict.site.portfolioHiddenBadge,
          portfolioShow: dict.site.portfolioShow,
          portfolioHide: dict.site.portfolioHide,
          portfolioCategory: dict.site.portfolioCategory,
          portfolioCaption: dict.site.portfolioCaption,
          portfolioUploadTo: dict.site.portfolioUploadTo,
          portfolioCategoryEg: dict.site.portfolioCategoryEg,
          portfolioUncategorized: dict.site.portfolioUncategorized,
          aboutLegend: dict.site.aboutLegend,
          aboutPlaceholder: dict.site.aboutPlaceholder,
          pricingLegend: dict.site.pricingLegend,
          priceName: dict.site.priceName,
          priceAmount: dict.site.priceAmount,
          priceIncludes: dict.site.priceIncludes,
          contactLegend: dict.site.contactLegend,
          contactEmail: dict.site.contactEmail,
          contactPhone: dict.site.contactPhone,
          contactInstagram: dict.site.contactInstagram,
          contactBooking: dict.site.contactBooking,
          contactBookingHint: dict.site.contactBookingHint,
          optionsLegend: dict.site.optionsLegend,
          optBilingual: dict.site.optBilingual,
          optBilingualHint: dict.site.optBilingualHint,
          optLeadForm: dict.site.optLeadForm,
          optLeadFormHint: dict.site.optLeadFormHint,
          enLegend: dict.site.enLegend,
          enHeroTitle: dict.site.enHeroTitle,
          enHeroSubtitle: dict.site.enHeroSubtitle,
          enAboutPlaceholder: dict.site.enAboutPlaceholder,
          save: dict.site.save,
          previewLabel: dict.site.previewLabel,
          delete: dict.common.delete,
        }}
      />

      <SiteLeads
        locale={locale}
        leads={leadRows ?? []}
        labels={{
          title: dict.site.leadsTitle,
          empty: dict.site.leadsEmpty,
          delete: dict.common.delete,
        }}
      />
    </main>
  )
}
