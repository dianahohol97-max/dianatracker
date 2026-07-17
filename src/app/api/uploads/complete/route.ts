import { NextResponse, type NextRequest } from 'next/server'
import { galleryPrefix, isVariantName } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface CompleteBody {
  galleryId: string
  key: string
  contentType: string
  sizeBytes: number
  width?: number
  height?: number
  /** Keys of already-uploaded renditions, e.g. { preview: "u/.../v/...jpg" }. */
  variants?: Record<string, string>
}

function isCompleteBody(value: unknown): value is CompleteBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const variantsOk =
    v.variants === undefined ||
    (typeof v.variants === 'object' &&
      v.variants !== null &&
      Object.entries(v.variants).every(
        ([name, key]) => isVariantName(name) && typeof key === 'string'
      ))
  return (
    typeof v.galleryId === 'string' &&
    typeof v.key === 'string' &&
    typeof v.contentType === 'string' &&
    typeof v.sizeBytes === 'number' &&
    (v.width === undefined || typeof v.width === 'number') &&
    (v.height === undefined || typeof v.height === 'number') &&
    variantsOk
  )
}

/**
 * Step 2 of the upload flow: after the browser finished the direct PUT to R2,
 * register the asset row. The insert runs under RLS as the signed-in user, and
 * a DB trigger bumps profiles.storage_used_bytes.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isCompleteBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Every key must sit under this user's prefix for this gallery — prevents
  // registering someone else's object (or a foreign path) as your asset.
  const prefix = galleryPrefix(user.id, body.galleryId)
  const allKeys = [body.key, ...Object.values(body.variants ?? {})]
  if (allKeys.some((key) => !key.startsWith(prefix))) {
    return NextResponse.json({ error: 'key_mismatch' }, { status: 400 })
  }

  const kind = body.contentType.startsWith('video/') ? 'video' : 'photo'

  const { data, error } = await supabase
    .from('assets')
    .insert({
      gallery_id: body.galleryId,
      owner_id: user.id,
      r2_key: body.key,
      kind,
      content_type: body.contentType,
      width: body.width ?? null,
      height: body.height ?? null,
      // Original size only; variant overhead (~5-10%) is deliberately not
      // counted against the quota to keep accounting simple for now.
      size_bytes: body.sizeBytes,
      variants: body.variants ?? {},
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assetId: data.id })
}
