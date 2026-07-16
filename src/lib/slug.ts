const UK_TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e',
  ё: 'e', ъ: '',
}

function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((char) => UK_TRANSLIT[char] ?? char)
    .join('')
}

/**
 * URL slug from a (possibly Cyrillic) title plus a short random suffix so
 * slugs stay unguessable-ish and collision-free without a uniqueness loop.
 */
export function slugify(title: string): string {
  const base = transliterate(title)
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  const suffix = crypto.randomUUID().slice(0, 8)
  return base ? `${base}-${suffix}` : suffix
}
