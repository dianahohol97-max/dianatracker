'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePortfolioAsset } from '@/lib/actions/portfolio'
import { generateImageVariants } from '@/lib/images/variants'
import type { SiteContent } from '@/lib/site/content'
import { THEME_CATALOG } from '@/lib/site/themes'
import { SiteRenderer, type PortfolioItem, type SiteLabels } from '@/components/site/SiteRenderer'
import type { Locale } from '@/lib/i18n/config'

export interface EditorLabels {
  publish: string
  handleLabel: string
  handleHint: string
  themeLabel: string
  themeNames: Record<string, string>
  heroLegend: string
  heroTitle: string
  heroSubtitle: string
  portfolioLegend: string
  portfolioHint: string
  portfolioUpload: string
  portfolioUploading: string
  aboutLegend: string
  aboutPlaceholder: string
  pricingLegend: string
  priceName: string
  priceAmount: string
  priceIncludes: string
  contactLegend: string
  contactEmail: string
  contactPhone: string
  contactInstagram: string
  contactBooking: string
  contactBookingHint: string
  save: string
  previewLabel: string
  delete: string
}

interface Pack {
  name: string
  price: string
  includes: string
}

const inputClass =
  'w-full border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-fg'

/**
 * Site editor with a LIVE preview: the right pane renders the same
 * SiteRenderer the public page uses, repainted on every keystroke and theme
 * switch. Inputs stay uncontrolled (named) so the plain <form action>
 * submit posts everything to the server action.
 */
export function SiteEditor({
  locale,
  action,
  initialHandle,
  initialCatalogValue,
  initialPublished,
  content,
  displayName,
  logoUrl,
  portfolio,
  siteLabels,
  labels,
}: {
  locale: Locale
  action: (formData: FormData) => Promise<void>
  initialHandle: string
  initialCatalogValue: string
  initialPublished: boolean
  content: SiteContent
  displayName: string | null
  logoUrl: string | null
  portfolio: PortfolioItem[]
  siteLabels: SiteLabels
  labels: EditorLabels
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [themeValue, setThemeValue] = useState(initialCatalogValue)
  const [heroTitle, setHeroTitle] = useState(content.hero.title)
  const [heroSubtitle, setHeroSubtitle] = useState(content.hero.subtitle)
  const [aboutText, setAboutText] = useState(content.about.text)
  const [packs, setPacks] = useState<Pack[]>(
    [0, 1, 2].map((index) => ({
      name: content.pricing.items[index]?.name ?? '',
      price: content.pricing.items[index]?.price ?? '',
      includes: (content.pricing.items[index]?.includes ?? []).join('\n'),
    }))
  )
  const [contact, setContact] = useState(content.contact)
  const [uploading, setUploading] = useState(0)

  const catalogEntry =
    THEME_CATALOG.find((entry) => entry.value === themeValue) ?? THEME_CATALOG[0]

  const previewContent: SiteContent = useMemo(
    () => ({
      hero: { title: heroTitle, subtitle: heroSubtitle },
      about: { text: aboutText },
      pricing: {
        items: packs
          .map((pack) => ({
            name: pack.name.trim(),
            price: pack.price.trim(),
            includes: pack.includes.split('\n').map((s) => s.trim()).filter(Boolean),
          }))
          .filter((pack) => pack.name),
      },
      contact,
    }),
    [heroTitle, heroSubtitle, aboutText, packs, contact]
  )

  function setPack(index: number, patch: Partial<Pack>) {
    setPacks((prev) => prev.map((pack, i) => (i === index ? { ...pack, ...patch } : pack)))
  }

  async function uploadPortfolio(files: File[]) {
    setUploading(files.length)
    for (const file of files) {
      try {
        const presign = async (variant?: string, blob?: Blob) => {
          const response = await fetch('/api/portfolio/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: variant ? `${variant}.jpg` : file.name,
              contentType: variant ? 'image/jpeg' : file.type,
              sizeBytes: blob ? blob.size : file.size,
              variant,
            }),
          })
          if (!response.ok) throw new Error(`presign ${response.status}`)
          return (await response.json()) as { uploadUrl: string; key: string }
        }

        const original = await presign()
        const put = await fetch(original.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!put.ok) throw new Error('put failed')

        const variants: Record<string, string> = {}
        for (const rendition of await generateImageVariants(file)) {
          const target = await presign(rendition.name, rendition.blob)
          const putVariant = await fetch(target.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: rendition.blob,
          })
          if (putVariant.ok) variants[rendition.name] = target.key
        }

        let width: number | undefined
        let height: number | undefined
        try {
          const bitmap = await createImageBitmap(file)
          width = bitmap.width
          height = bitmap.height
          bitmap.close()
        } catch {
          /* dimensions optional */
        }

        await fetch('/api/portfolio/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: original.key,
            contentType: file.type,
            sizeBytes: file.size,
            width,
            height,
            variants,
          }),
        })
      } catch {
        /* one failed file must not stop the rest */
      }
      setUploading((n) => n - 1)
    }
    router.refresh()
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(340px,420px)_1fr]">
      {/* ---------------- form ---------------- */}
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded border border-line p-5">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={initialPublished} />
            {labels.publish}
          </label>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted" htmlFor="se-handle">{labels.handleLabel}</label>
            <input id="se-handle" name="handle" defaultValue={initialHandle} className={inputClass} />
            <p className="text-xs text-muted">{labels.handleHint}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted" htmlFor="se-theme">{labels.themeLabel}</label>
            <select
              id="se-theme"
              name="theme"
              value={themeValue}
              onChange={(event) => setThemeValue(event.target.value)}
              className={inputClass}
            >
              {THEME_CATALOG.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {labels.themeNames[entry.value] ?? entry.value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3 rounded border border-line p-5">
          <legend className="px-2 text-sm text-muted">{labels.heroLegend}</legend>
          <input
            name="hero_title"
            defaultValue={content.hero.title}
            placeholder={labels.heroTitle}
            onChange={(event) => setHeroTitle(event.target.value)}
            className={inputClass}
          />
          <input
            name="hero_subtitle"
            defaultValue={content.hero.subtitle}
            placeholder={labels.heroSubtitle}
            onChange={(event) => setHeroSubtitle(event.target.value)}
            className={inputClass}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded border border-line p-5">
          <legend className="px-2 text-sm text-muted">{labels.portfolioLegend}</legend>
          <p className="text-xs leading-relaxed text-muted">{labels.portfolioHint}</p>
          <label className="cursor-pointer rounded border-2 border-dashed border-line px-4 py-6 text-center text-sm text-muted transition-colors hover:border-accent hover:text-accent">
            {uploading > 0 ? `${labels.portfolioUploading} ${uploading}…` : labels.portfolioUpload}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                event.target.value = ''
                if (files.length > 0) void uploadPortfolio(files)
              }}
            />
          </label>
          {portfolio.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {portfolio.map((item) => (
                <span key={item.id} className="group relative block">
                  <span
                    className="block aspect-[4/5] rounded bg-line"
                    style={
                      item.previewUrl
                        ? { background: `center / cover no-repeat url("${item.previewUrl}")` }
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    aria-label={labels.delete}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePortfolioAsset(locale, item.id)
                        router.refresh()
                      })
                    }
                    disabled={pending}
                    className="absolute right-1 top-1 hidden h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold shadow group-hover:grid"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded border border-line p-5">
          <legend className="px-2 text-sm text-muted">{labels.aboutLegend}</legend>
          <textarea
            name="about_text"
            rows={5}
            defaultValue={content.about.text}
            placeholder={labels.aboutPlaceholder}
            onChange={(event) => setAboutText(event.target.value)}
            className={inputClass}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded border border-line p-5">
          <legend className="px-2 text-sm text-muted">{labels.pricingLegend}</legend>
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2 rounded border border-line p-3">
              <input
                name={`price_name_${index}`}
                defaultValue={packs[index].name}
                placeholder={labels.priceName}
                onChange={(event) => setPack(index, { name: event.target.value })}
                className={inputClass}
              />
              <input
                name={`price_amount_${index}`}
                defaultValue={packs[index].price}
                placeholder={labels.priceAmount}
                onChange={(event) => setPack(index, { price: event.target.value })}
                className={inputClass}
              />
              <textarea
                name={`price_includes_${index}`}
                rows={3}
                defaultValue={packs[index].includes}
                placeholder={labels.priceIncludes}
                onChange={(event) => setPack(index, { includes: event.target.value })}
                className={inputClass}
              />
            </div>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded border border-line p-5">
          <legend className="px-2 text-sm text-muted">{labels.contactLegend}</legend>
          <input
            name="contact_email"
            type="email"
            defaultValue={content.contact.email}
            placeholder={labels.contactEmail}
            onChange={(event) => setContact((c) => ({ ...c, email: event.target.value }))}
            className={inputClass}
          />
          <input
            name="contact_phone"
            defaultValue={content.contact.phone}
            placeholder={labels.contactPhone}
            onChange={(event) => setContact((c) => ({ ...c, phone: event.target.value }))}
            className={inputClass}
          />
          <input
            name="contact_instagram"
            defaultValue={content.contact.instagram}
            placeholder={labels.contactInstagram}
            onChange={(event) => setContact((c) => ({ ...c, instagram: event.target.value }))}
            className={inputClass}
          />
          <input
            name="contact_booking_url"
            defaultValue={content.contact.bookingUrl}
            placeholder={labels.contactBooking}
            onChange={(event) => setContact((c) => ({ ...c, bookingUrl: event.target.value }))}
            className={inputClass}
          />
          <p className="text-xs text-muted">{labels.contactBookingHint}</p>
        </fieldset>

        <button
          type="submit"
          className="self-start rounded-full border border-fg px-8 py-3 text-sm font-bold uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
        >
          {labels.save}
        </button>
      </form>

      {/* ---------------- live preview ---------------- */}
      <div className="min-w-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">
          {labels.previewLabel}
        </p>
        <div className="sticky top-4 overflow-hidden rounded-2xl border border-line shadow-sm">
          <div style={{ zoom: 0.62 }}>
            <SiteRenderer
              theme={catalogEntry.theme}
              mode={catalogEntry.mode}
              content={previewContent}
              displayName={displayName}
              logoUrl={logoUrl}
              portfolio={portfolio}
              labels={siteLabels}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
