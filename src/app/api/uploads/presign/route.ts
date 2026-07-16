import { NextResponse, type NextRequest } from 'next/server'
import { getStorage, originalKey } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB per file (video-friendly)

interface PresignBody {
  galleryId: string
  fileName: string
  contentType: string
  sizeBytes: number
}

function isPresignBody(value: unknown): value is PresignBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.galleryId === 'string' &&
    typeof v.fileName === 'string' &&
    typeof v.contentType === 'string' &&
    typeof v.sizeBytes === 'number'
  )
}

/**
 * Step 1 of the upload flow: the browser asks for a presigned PUT URL, then
 * uploads the file DIRECTLY to R2 (never through our servers), then calls
 * /api/uploads/complete to register the asset row.
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
  if (!isPresignBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const isPhoto = body.contentType.startsWith('image/')
  const isVideo = body.contentType.startsWith('video/')
  if (!isPhoto && !isVideo) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })
  }
  if (body.sizeBytes <= 0 || body.sizeBytes > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  // Ownership check — RLS returns nothing for someone else's gallery.
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, owner_id')
    .eq('id', body.galleryId)
    .eq('owner_id', user.id)
    .single()
  if (!gallery) {
    return NextResponse.json({ error: 'gallery_not_found' }, { status: 404 })
  }

  // Plan quota check.
  const { data: profile } = await supabase
    .from('profiles')
    .select('storage_used_bytes, storage_limit_bytes')
    .eq('user_id', user.id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
  }
  if (profile.storage_used_bytes + body.sizeBytes > profile.storage_limit_bytes) {
    return NextResponse.json({ error: 'storage_quota_exceeded' }, { status: 403 })
  }

  const key = originalKey(user.id, body.galleryId, body.fileName)
  const { url } = await getStorage().getUploadUrl({
    key,
    contentType: body.contentType,
  })

  return NextResponse.json({ uploadUrl: url, key })
}
