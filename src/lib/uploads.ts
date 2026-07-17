import type { SupabaseClient } from '@supabase/supabase-js'
import { effectiveGalleryPlan, planStorageBytes } from '@/lib/plans'
import { galleryPrefix, isVariantName } from '@/lib/storage'

/**
 * Shared server-side upload logic for the single-PUT (/api/uploads/*) and
 * multipart (/api/uploads/multipart/*) flows: one place for the ownership +
 * quota gate and for asset registration, so the two paths cannot drift.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB per file (video-friendly)

export type UploadCheck = { ok: true } | { ok: false; status: number; error: string }

export async function authorizeUpload(
  supabase: SupabaseClient,
  userId: string,
  input: { galleryId: string; contentType: string; sizeBytes: number }
): Promise<UploadCheck> {
  const isPhoto = input.contentType.startsWith('image/')
  const isVideo = input.contentType.startsWith('video/')
  if (!isPhoto && !isVideo) {
    return { ok: false, status: 415, error: 'unsupported_type' }
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_FILE_BYTES) {
    return { ok: false, status: 413, error: 'file_too_large' }
  }

  // Ownership check — RLS returns nothing for someone else's gallery.
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, owner_id')
    .eq('id', input.galleryId)
    .eq('owner_id', userId)
    .single()
  if (!gallery) {
    return { ok: false, status: 404, error: 'gallery_not_found' }
  }

  // Plan gates: quota (with the post-cancellation grace period applied
  // lazily) and the video feature, which starts on the «Плюс» tier.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, storage_used_bytes, storage_limit_bytes, grace_until')
    .eq('user_id', userId)
    .single()
  if (!profile) {
    return { ok: false, status: 404, error: 'profile_not_found' }
  }

  const plan = effectiveGalleryPlan(profile.plan, profile.grace_until)
  if (isVideo && !plan.features.video) {
    return { ok: false, status: 403, error: 'plan_video_required' }
  }

  const effectiveLimit = Math.min(profile.storage_limit_bytes, planStorageBytes(plan))
  if (profile.storage_used_bytes + input.sizeBytes > effectiveLimit) {
    return { ok: false, status: 403, error: 'storage_quota_exceeded' }
  }

  return { ok: true }
}

export interface RegisterAssetInput {
  galleryId: string
  key: string
  contentType: string
  sizeBytes: number
  width?: number
  height?: number
  variants?: Record<string, string>
}

export function parseRegisterAssetInput(value: unknown): RegisterAssetInput | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const variantsOk =
    v.variants === undefined ||
    (typeof v.variants === 'object' &&
      v.variants !== null &&
      Object.entries(v.variants).every(
        ([name, key]) => isVariantName(name) && typeof key === 'string'
      ))
  const ok =
    typeof v.galleryId === 'string' &&
    typeof v.key === 'string' &&
    typeof v.contentType === 'string' &&
    typeof v.sizeBytes === 'number' &&
    (v.width === undefined || typeof v.width === 'number') &&
    (v.height === undefined || typeof v.height === 'number') &&
    variantsOk
  return ok ? (v as unknown as RegisterAssetInput) : null
}

export type RegisterResult =
  | { ok: true; assetId: string }
  | { ok: false; status: number; error: string }

export async function registerAsset(
  supabase: SupabaseClient,
  userId: string,
  input: RegisterAssetInput
): Promise<RegisterResult> {
  // Every key must sit under this user's prefix for this gallery — prevents
  // registering someone else's object (or a foreign path) as your asset.
  const prefix = galleryPrefix(userId, input.galleryId)
  const allKeys = [input.key, ...Object.values(input.variants ?? {})]
  if (allKeys.some((key) => !key.startsWith(prefix))) {
    return { ok: false, status: 400, error: 'key_mismatch' }
  }

  const kind = input.contentType.startsWith('video/') ? 'video' : 'photo'

  const { data, error } = await supabase
    .from('assets')
    .insert({
      gallery_id: input.galleryId,
      owner_id: userId,
      r2_key: input.key,
      kind,
      content_type: input.contentType,
      width: input.width ?? null,
      height: input.height ?? null,
      // Original size only; variant overhead (~5-10%) is deliberately not
      // counted against the quota to keep accounting simple for now.
      size_bytes: input.sizeBytes,
      variants: input.variants ?? {},
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, status: 500, error: error.message }
  }
  return { ok: true, assetId: data.id }
}
