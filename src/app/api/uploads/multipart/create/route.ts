import { NextResponse, type NextRequest } from 'next/server'
import { getStorage, originalKey } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { authorizeUpload } from '@/lib/uploads'

export const runtime = 'nodejs'

interface CreateBody {
  galleryId: string
  fileName: string
  contentType: string
  sizeBytes: number
}

function isCreateBody(value: unknown): value is CreateBody {
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
 * Multipart flow (large videos), step 1: open the upload on R2 after the same
 * ownership + quota gate as the single-PUT path. The browser then requests
 * part URLs, PUTs parts straight to R2, and finalizes via .../complete.
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
  if (!isCreateBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const check = await authorizeUpload(supabase, user.id, body)
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const key = originalKey(user.id, body.galleryId, body.fileName)
  const { uploadId } = await getStorage().createMultipartUpload({
    key,
    contentType: body.contentType,
  })

  return NextResponse.json({ key, uploadId })
}
