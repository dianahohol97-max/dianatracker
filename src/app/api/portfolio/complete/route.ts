import { NextResponse, type NextRequest } from 'next/server'
import { isVariantName } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface CompleteBody {
  key: string
  contentType: string
  sizeBytes: number
  width?: number
  height?: number
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
    typeof v.key === 'string' &&
    typeof v.contentType === 'string' &&
    typeof v.sizeBytes === 'number' &&
    (v.width === undefined || typeof v.width === 'number') &&
    (v.height === undefined || typeof v.height === 'number') &&
    variantsOk
  )
}

/** Registers a portfolio photo after the direct PUT; RLS scopes the insert. */
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

  const prefix = `u/${user.id}/portfolio/`
  const allKeys = [body.key, ...Object.values(body.variants ?? {})]
  if (allKeys.some((key) => !key.startsWith(prefix))) {
    return NextResponse.json({ error: 'key_mismatch' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('portfolio_assets')
    .insert({
      owner_id: user.id,
      r2_key: body.key,
      content_type: body.contentType,
      width: body.width ?? null,
      height: body.height ?? null,
      size_bytes: body.sizeBytes,
      variants: body.variants ?? {},
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ id: data.id })
}
