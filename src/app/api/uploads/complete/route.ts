import { NextResponse, type NextRequest } from 'next/server'
import { galleryPrefix } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface CompleteBody {
  galleryId: string
  key: string
  contentType: string
  sizeBytes: number
  width?: number
  height?: number
}

function isCompleteBody(value: unknown): value is CompleteBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.galleryId === 'string' &&
    typeof v.key === 'string' &&
    typeof v.contentType === 'string' &&
    typeof v.sizeBytes === 'number' &&
    (v.width === undefined || typeof v.width === 'number') &&
    (v.height === undefined || typeof v.height === 'number')
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

  // The key must sit under this user's prefix for this gallery — prevents
  // registering someone else's object (or a foreign path) as your asset.
  if (!body.key.startsWith(galleryPrefix(user.id, body.galleryId))) {
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
      size_bytes: body.sizeBytes,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assetId: data.id })
}
