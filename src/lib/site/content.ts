/**
 * Site content — one JSON document per site (sites.content). Blocks are
 * shared across themes; this is the only thing the photographer edits.
 */

export interface PricingItem {
  name: string
  price: string
  /** What the price includes — one line per item. */
  includes: string[]
}

export interface SiteContent {
  hero: { title: string; subtitle: string }
  about: { text: string }
  pricing: { items: PricingItem[] }
  contact: {
    email: string
    phone: string
    instagram: string
    bookingUrl: string
  }
  /** Optional English variant of the text blocks (bilingual sites). */
  en: {
    hero: { title: string; subtitle: string }
    about: { text: string }
  }
  settings: {
    /** Show the UA/EN switcher and serve `en` texts on the /en route. */
    bilingual: boolean
    /** Render the lead form in the contact block. */
    leadForm: boolean
  }
}

export const EMPTY_CONTENT: SiteContent = {
  hero: { title: '', subtitle: '' },
  about: { text: '' },
  pricing: { items: [] },
  contact: { email: '', phone: '', instagram: '', bookingUrl: '' },
  en: { hero: { title: '', subtitle: '' }, about: { text: '' } },
  settings: { bilingual: false, leadForm: false },
}

/**
 * Content as the visitor should see it: on the English route of a bilingual
 * site the translated text blocks override the Ukrainian ones (falling back
 * per-field, so a missing translation never blanks a block).
 */
export function localizedSiteContent(content: SiteContent, locale: string): SiteContent {
  if (locale !== 'en' || !content.settings.bilingual) return content
  return {
    ...content,
    hero: {
      title: content.en.hero.title || content.hero.title,
      subtitle: content.en.hero.subtitle || content.hero.subtitle,
    },
    about: { text: content.en.about.text || content.about.text },
  }
}

/** Tolerant parse of sites.content — missing fields fall back to empty. */
export function parseSiteContent(value: unknown): SiteContent {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const hero = (v.hero ?? {}) as Record<string, unknown>
  const about = (v.about ?? {}) as Record<string, unknown>
  const pricing = (v.pricing ?? {}) as Record<string, unknown>
  const contact = (v.contact ?? {}) as Record<string, unknown>
  const en = (typeof v.en === 'object' && v.en !== null ? v.en : {}) as Record<string, unknown>
  const enHero = (en.hero ?? {}) as Record<string, unknown>
  const enAbout = (en.about ?? {}) as Record<string, unknown>
  const settings = (
    typeof v.settings === 'object' && v.settings !== null ? v.settings : {}
  ) as Record<string, unknown>
  const items = Array.isArray(pricing.items) ? pricing.items : []

  return {
    hero: {
      title: typeof hero.title === 'string' ? hero.title : '',
      subtitle: typeof hero.subtitle === 'string' ? hero.subtitle : '',
    },
    about: { text: typeof about.text === 'string' ? about.text : '' },
    pricing: {
      items: items
        .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
        .map((i) => ({
          name: typeof i.name === 'string' ? i.name : '',
          price: typeof i.price === 'string' ? i.price : '',
          includes: Array.isArray(i.includes)
            ? i.includes.filter((line): line is string => typeof line === 'string' && !!line)
            : // legacy shape: a single description becomes the first line
              typeof i.description === 'string' && i.description
              ? [i.description]
              : [],
        }))
        .filter((i) => i.name),
    },
    contact: {
      email: typeof contact.email === 'string' ? contact.email : '',
      phone: typeof contact.phone === 'string' ? contact.phone : '',
      instagram: typeof contact.instagram === 'string' ? contact.instagram : '',
      bookingUrl: typeof contact.bookingUrl === 'string' ? contact.bookingUrl : '',
    },
    en: {
      hero: {
        title: typeof enHero.title === 'string' ? enHero.title : '',
        subtitle: typeof enHero.subtitle === 'string' ? enHero.subtitle : '',
      },
      about: { text: typeof enAbout.text === 'string' ? enAbout.text : '' },
    },
    settings: {
      bilingual: settings.bilingual === true,
      leadForm: settings.leadForm === true,
    },
  }
}
