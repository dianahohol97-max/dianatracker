import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client — BYPASSES RLS. Server-only, and only for flows that
 * have no user session by design (payment webhooks, checkout bookkeeping).
 * Everything user-initiated must keep going through the cookie-scoped client
 * so RLS stays the authority.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
