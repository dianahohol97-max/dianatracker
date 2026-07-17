/**
 * Row types for the Phase 1 schema (supabase/migrations/0001_phase1_galleries.sql).
 * Kept by hand for now; switch to `supabase gen types typescript` once the
 * schema stabilises.
 */

export type Locale = 'uk' | 'en'

export interface Profile {
  user_id: string
  display_name: string | null
  logo_url: string | null
  locale: Locale
  plan: string
  site_plan: string
  grace_until: string | null
  storage_used_bytes: number
  storage_limit_bytes: number
  created_at: string
  updated_at: string
}

export interface Gallery {
  id: string
  owner_id: string
  slug: string
  title: string
  description: string | null
  event_date: string | null
  cover_asset_id: string | null
  password_hash: string | null
  expires_at: string | null
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export type AssetKind = 'photo' | 'video'

export interface Asset {
  id: string
  gallery_id: string
  owner_id: string
  r2_key: string
  kind: AssetKind
  content_type: string
  width: number | null
  height: number | null
  size_bytes: number
  variants: Record<string, string>
  position: number
  created_at: string
}

export type SelectionKind = 'favorite' | 'retouch'

export interface Selection {
  id: string
  gallery_id: string
  asset_id: string
  client_token: string
  kind: SelectionKind
  created_at: string
}
