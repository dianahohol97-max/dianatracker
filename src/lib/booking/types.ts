export type SlotStatus = 'free' | 'booked' | 'paid' | 'canceled'
export type BookingPayMethod = 'mono' | 'wfp' | 'manual' | 'card'

export interface BookingSettings {
  user_id: string
  enabled: boolean
  handle: string | null
  notify_email: string | null
  mono_enabled: boolean
  mono_token: string | null
  wfp_enabled: boolean
  wfp_merchant: string | null
  wfp_secret: string | null
  manual_link_enabled: boolean
  manual_link: string | null
  card_enabled: boolean
  card_details: string | null
  created_at: string
  updated_at: string
}

export interface BookingSlot {
  id: string
  owner_id: string
  starts_at: string
  duration_minutes: number
  price_uah: number
  status: SlotStatus
  client_name: string | null
  client_phone: string | null
  client_email: string | null
  booking_token: string | null
  payment_method: BookingPayMethod | null
  invoice_id: string | null
  booked_at: string | null
  paid_at: string | null
  created_at: string
}

/** '2026-07-20T14:00:00' → '20.07.2026 · 14:00' (wall-clock, no TZ math). */
export function formatSlot(startsAt: string): string {
  const [date, time] = startsAt.split('T')
  if (!date || !time) return startsAt
  const [y, m, d] = date.split('-')
  return `${d}.${m}.${y} · ${time.slice(0, 5)}`
}
