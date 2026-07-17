'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PricingItem, SiteContent } from '@/lib/site/content'
import { THEME_CATALOG } from '@/lib/site/themes'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'

async function requireUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/uk/login')
  return { supabase, user }
}

function str(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim()
}

export async function saveSite(locale: Locale, formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const handle = str(formData, 'handle').toLowerCase() || null
  if (handle && !/^[a-z0-9][a-z0-9-]{2,31}$/.test(handle)) {
    throw new Error('Handle must be 3-32 chars: latin letters, digits, dashes')
  }

  // The editor exposes the 8-entry catalog; «Опівніч» maps to tysha+night.
  const catalogEntry =
    THEME_CATALOG.find((entry) => entry.value === str(formData, 'theme')) ?? THEME_CATALOG[0]

  const items: PricingItem[] = [0, 1, 2]
    .map((index) => ({
      name: str(formData, `price_name_${index}`),
      price: str(formData, `price_amount_${index}`),
      includes: String(formData.get(`price_includes_${index}`) ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }))
    .filter((item) => item.name)

  const content: SiteContent = {
    hero: { title: str(formData, 'hero_title'), subtitle: str(formData, 'hero_subtitle') },
    about: { text: str(formData, 'about_text') },
    pricing: { items },
    contact: {
      email: str(formData, 'contact_email'),
      phone: str(formData, 'contact_phone'),
      instagram: str(formData, 'contact_instagram'),
      bookingUrl: str(formData, 'contact_booking_url'),
    },
  }

  const { error } = await supabase.from('sites').upsert(
    {
      user_id: user.id,
      handle,
      theme: catalogEntry.theme,
      mode: catalogEntry.mode,
      is_published: formData.get('is_published') === 'on',
      content,
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`Failed to save site: ${error.message}`)

  revalidatePath(`/${locale}/dashboard/site`)
  if (handle) revalidatePath(`/${locale}/s/${handle}`)
}
