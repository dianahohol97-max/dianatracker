import type { Locale } from './config'
import { uk } from './dictionaries/uk'

/** The Ukrainian dictionary is the source of truth for the shape. */
export type Dictionary = {
  [Section in keyof typeof uk]: { [Key in keyof (typeof uk)[Section]]: string }
}

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  uk: () => Promise.resolve(uk),
  en: () => import('./dictionaries/en').then((m) => m.en),
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]()
}
