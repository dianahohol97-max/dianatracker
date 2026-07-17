'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

function str(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? '').trim()
  return value || null
}

export async function saveBookingSettings(locale: Locale, formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const handle = str(formData, 'handle')?.toLowerCase() ?? null
  if (handle && !/^[a-z0-9][a-z0-9-]{2,31}$/.test(handle)) {
    throw new Error('Handle must be 3-32 chars: latin letters, digits, dashes')
  }

  const { error } = await supabase.from('booking_settings').upsert(
    {
      user_id: user.id,
      enabled: formData.get('enabled') === 'on',
      handle,
      notify_email: str(formData, 'notify_email'),
      mono_enabled: formData.get('mono_enabled') === 'on',
      mono_token: str(formData, 'mono_token'),
      wfp_enabled: formData.get('wfp_enabled') === 'on',
      wfp_merchant: str(formData, 'wfp_merchant'),
      wfp_secret: str(formData, 'wfp_secret'),
      manual_link_enabled: formData.get('manual_link_enabled') === 'on',
      manual_link: str(formData, 'manual_link'),
      card_enabled: formData.get('card_enabled') === 'on',
      card_details: str(formData, 'card_details'),
    },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`Failed to save booking settings: ${error.message}`)

  revalidatePath(`/${locale}/dashboard/booking`)
}

export async function addBookingSlot(locale: Locale, formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser()

  const date = str(formData, 'date')
  const time = str(formData, 'time')
  const duration = Number(formData.get('duration') ?? 60)
  const price = Number(formData.get('price') ?? 0)
  if (!date || !time || !Number.isFinite(duration) || !Number.isFinite(price)) {
    throw new Error('Date, time, duration and price are required')
  }

  const { error } = await supabase.from('booking_slots').insert({
    owner_id: user.id,
    starts_at: `${date}T${time}:00`,
    duration_minutes: Math.round(duration),
    price_uah: price,
  })
  if (error) throw new Error(`Failed to add slot: ${error.message}`)

  revalidatePath(`/${locale}/dashboard/booking`)
}

export async function deleteBookingSlot(locale: Locale, slotId: string): Promise<void> {
  const { supabase } = await requireUser()
  // RLS scopes the delete to the owner; only untouched slots can be removed.
  const { error } = await supabase
    .from('booking_slots')
    .delete()
    .eq('id', slotId)
    .eq('status', 'free')
  if (error) throw new Error(`Failed to delete slot: ${error.message}`)
  revalidatePath(`/${locale}/dashboard/booking`)
}

/** Manual payment confirmation — the photographer checked their bank. */
export async function markSlotPaid(locale: Locale, slotId: string): Promise<void> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('booking_slots')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', slotId)
    .eq('status', 'booked')
  if (error) throw new Error(`Failed to mark paid: ${error.message}`)
  revalidatePath(`/${locale}/dashboard/booking`)
}

/** Cancels a booking and reopens the time for other clients. */
export async function reopenSlot(locale: Locale, slotId: string): Promise<void> {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('booking_slots')
    .update({
      status: 'free',
      client_name: null,
      client_phone: null,
      client_email: null,
      booking_token: null,
      payment_method: null,
      invoice_id: null,
      booked_at: null,
      paid_at: null,
    })
    .eq('id', slotId)
    .in('status', ['booked', 'paid'])
  if (error) throw new Error(`Failed to reopen slot: ${error.message}`)
  revalidatePath(`/${locale}/dashboard/booking`)
}
