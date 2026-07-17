import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { saveSite } from '@/lib/actions/site'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { parseSiteContent } from '@/lib/site/content'
import { THEME_CATALOG } from '@/lib/site/themes'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface SiteRow {
  handle: string | null
  theme: string
  mode: string
  is_published: boolean
  content: unknown
}

const inputClass = 'border border-line bg-transparent px-3 py-2 outline-none focus:border-fg'

export default async function SiteEditorPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: site } = await supabase
    .from('sites')
    .select('handle, theme, mode, is_published, content')
    .eq('user_id', user.id)
    .maybeSingle<SiteRow>()

  const content = parseSiteContent(site?.content)
  const currentCatalogValue =
    site?.theme === 'tysha' && site.mode === 'night' ? 'opivnich' : (site?.theme ?? 'tysha')

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicUrl = site?.is_published && site.handle ? `${appUrl}/${locale}/s/${site.handle}` : null

  const saveAction = saveSite.bind(null, locale)

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href={`/${locale}/dashboard`} className="text-sm text-muted hover:text-fg">
        ← {dict.dashboard.title}
      </Link>
      <h1 className="mt-6 font-display text-4xl">{dict.site.title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{dict.site.intro}</p>
      {publicUrl && (
        <p className="mt-3 break-all text-sm text-muted">
          {dict.site.publicLink}: {publicUrl}
        </p>
      )}

      <form action={saveAction} className="mt-10 flex flex-col gap-5">
        <div className="flex flex-col gap-4 border border-line p-6">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={site?.is_published} />
            {dict.site.publish}
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted" htmlFor="site-handle">{dict.site.handleLabel}</label>
            <input
              id="site-handle"
              name="handle"
              defaultValue={site?.handle ?? ''}
              placeholder="olena-romaniuk"
              className={inputClass}
            />
            <p className="text-xs text-muted">{dict.site.handleHint}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted" htmlFor="site-theme">{dict.site.themeLabel}</label>
            <select id="site-theme" name="theme" defaultValue={currentCatalogValue} className={inputClass}>
              {THEME_CATALOG.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {themeNames[entry.value] ?? entry.value}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">{dict.site.themeHint}</p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3 border border-line p-6">
          <legend className="px-2 text-sm text-muted">{dict.site.heroLegend}</legend>
          <input
            name="hero_title"
            defaultValue={content.hero.title}
            placeholder={dict.site.heroTitle}
            className={inputClass}
          />
          <input
            name="hero_subtitle"
            defaultValue={content.hero.subtitle}
            placeholder={dict.site.heroSubtitle}
            className={inputClass}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3 border border-line p-6">
          <legend className="px-2 text-sm text-muted">{dict.site.aboutLegend}</legend>
          <textarea
            name="about_text"
            defaultValue={content.about.text}
            rows={5}
            placeholder={dict.site.aboutPlaceholder}
            className={inputClass}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4 border border-line p-6">
          <legend className="px-2 text-sm text-muted">{dict.site.pricingLegend}</legend>
          {[0, 1, 2].map((index) => {
            const item = content.pricing.items[index]
            return (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_1fr]">
                <input
                  name={`price_name_${index}`}
                  defaultValue={item?.name ?? ''}
                  placeholder={dict.site.priceName}
                  className={inputClass}
                />
                <input
                  name={`price_desc_${index}`}
                  defaultValue={item?.description ?? ''}
                  placeholder={dict.site.priceDesc}
                  className={inputClass}
                />
                <input
                  name={`price_amount_${index}`}
                  defaultValue={item?.price ?? ''}
                  placeholder={dict.site.priceAmount}
                  className={inputClass}
                />
              </div>
            )
          })}
        </fieldset>

        <fieldset className="flex flex-col gap-3 border border-line p-6">
          <legend className="px-2 text-sm text-muted">{dict.site.contactLegend}</legend>
          <input
            name="contact_email"
            type="email"
            defaultValue={content.contact.email}
            placeholder={dict.site.contactEmail}
            className={inputClass}
          />
          <input
            name="contact_phone"
            defaultValue={content.contact.phone}
            placeholder={dict.site.contactPhone}
            className={inputClass}
          />
          <input
            name="contact_instagram"
            defaultValue={content.contact.instagram}
            placeholder={dict.site.contactInstagram}
            className={inputClass}
          />
          <input
            name="contact_booking_url"
            defaultValue={content.contact.bookingUrl}
            placeholder={dict.site.contactBooking}
            className={inputClass}
          />
          <p className="text-xs text-muted">{dict.site.contactBookingHint}</p>
        </fieldset>

        <p className="text-xs leading-relaxed text-muted">{dict.site.portfolioNote}</p>

        <button
          type="submit"
          className="self-start border border-fg px-8 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
        >
          {dict.site.save}
        </button>
      </form>
    </main>
  )
}
