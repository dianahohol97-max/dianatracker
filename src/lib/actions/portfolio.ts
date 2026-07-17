'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Locale } from '@/lib/i18n/config'

export async function deletePortfolioAsset(locale: Locale, assetId: string): Promise<void> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/uk/login')

  const { data: asset } = await supabase
    .from('portfolio_assets')
    .select('id, owner_id, r2_key, variants')
    .eq('id', assetId)
    .single()
  if (!asset || asset.owner_id !== user.id) {
    throw new Error('Portfolio photo not found')
  }

  const variantKeys = Object.values(asset.variants as Record<string, string>)
  await getStorage().delete([asset.r2_key, ...variantKeys])

  const { error } = await supabase.from('portfolio_assets').delete().eq('id', assetId)
  if (error) throw new Error(`Failed to delete portfolio photo: ${error.message}`)

  revalidatePath(`/${locale}/dashboard/site`)
}
