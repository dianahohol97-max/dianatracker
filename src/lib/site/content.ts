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
}

export const EMPTY_CONTENT: SiteContent = {
  hero: { title: '', subtitle: '' },
  about: { text: '' },
  pricing: { items: [] },
  contact: { email: '', phone: '', instagram: '', bookingUrl: '' },
}

/** Tolerant parse of sites.content — missing fields fall back to empty. */
export function parseSiteContent(value: unknown): SiteContent {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const hero = (v.hero ?? {}) as Record<string, unknown>
  const about = (v.about ?? {}) as Record<string, unknown>
  const pricing = (v.pricing ?? {}) as Record<string, unknown>
  const contact = (v.contact ?? {}) as Record<string, unknown>
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
  }
}
