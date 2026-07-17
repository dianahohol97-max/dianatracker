import { NextResponse, type NextRequest } from 'next/server'
import { galleryPrefix, getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_PARTS_PER_REQUEST = 1000 // S3/R2 hard limit on parts per upload

interface PartUrlsBody {
  galleryId: string
  key: string
  uploadId: string
  partNumbers: number[]
}

function isPartUrlsBody(value: unknown): value is PartUrlsBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.galleryId === 'string' &&
    typeof v.key === 'string' &&
    typeof v.uploadId === 'string' &&
    Array.isArray(v.partNumbers) &&
    v.partNumbers.length > 0 &&
    v.partNumbers.length <= MAX_PARTS_PER_REQUEST &&
    v.partNumbers.every(
      (n) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10000
    )
  )
}

/** Multipart flow, step 2: presigned PUT URLs for the requested parts. */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isPartUrlsBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body.key.startsWith(galleryPrefix(user.id, body.galleryId))) {
    return NextResponse.json({ error: 'key_mismatch' }, { status: 400 })
  }

  const storage = getStorage()
  const urls: Record<number, string> = {}
  for (const partNumber of body.partNumbers) {
    urls[partNumber] = await storage.getPartUploadUrl(body.key, body.uploadId, partNumber)
  }

  return NextResponse.json({ urls })
}
