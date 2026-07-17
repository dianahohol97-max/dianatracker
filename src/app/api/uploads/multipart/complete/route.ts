import { NextResponse, type NextRequest } from 'next/server'
import { galleryPrefix, getStorage } from '@/lib/storage'
import type { UploadedPart } from '@/lib/storage/StorageProvider'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseRegisterAssetInput, registerAsset } from '@/lib/uploads'

export const runtime = 'nodejs'

interface MultipartFields {
  uploadId: string
  parts: UploadedPart[]
}

function parseMultipartFields(value: unknown): MultipartFields | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const partsOk =
    Array.isArray(v.parts) &&
    v.parts.length > 0 &&
    v.parts.every(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as Record<string, unknown>).partNumber === 'number' &&
        typeof (p as Record<string, unknown>).etag === 'string'
    )
  if (typeof v.uploadId !== 'string' || !partsOk) return null
  return { uploadId: v.uploadId, parts: v.parts as unknown as UploadedPart[] }
}

/**
 * Multipart flow, step 3: stitch the parts together on R2, then register the
 * asset row exactly like the single-PUT complete route (registerAsset also
 * re-validates the key prefix, so completing foreign uploads is not possible).
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const raw: unknown = await request.json().catch(() => null)
  const register = parseRegisterAssetInput(raw)
  const multipart = parseMultipartFields(raw)
  if (!register || !multipart) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Validate ownership of the key BEFORE touching R2 state.
  if (!register.key.startsWith(galleryPrefix(user.id, register.galleryId))) {
    return NextResponse.json({ error: 'key_mismatch' }, { status: 400 })
  }

  const sortedParts = [...multipart.parts].sort((a, b) => a.partNumber - b.partNumber)
  await getStorage().completeMultipartUpload(register.key, multipart.uploadId, sortedParts)

  const result = await registerAsset(supabase, user.id, register)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({ assetId: result.assetId })
}
