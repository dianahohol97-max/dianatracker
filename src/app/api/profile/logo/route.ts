import { NextResponse, type NextRequest } from 'next/server'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

interface LogoBody {
  contentType: string
  sizeBytes: number
}

function isLogoBody(value: unknown): value is LogoBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.contentType === 'string' && typeof v.sizeBytes === 'number'
}

/** Presigned PUT for the photographer's brand logo (small, image-only). */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isLogoBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!ALLOWED.has(body.contentType)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })
  }
  if (body.sizeBytes <= 0 || body.sizeBytes > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const key = `u/${user.id}/brand/${crypto.randomUUID()}-logo.${EXT[body.contentType]}`
  const { url } = await getStorage().getUploadUrl({ key, contentType: body.contentType })

  return NextResponse.json({ uploadUrl: url, key })
}
