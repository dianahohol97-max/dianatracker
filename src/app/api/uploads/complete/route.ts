import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseRegisterAssetInput, registerAsset } from '@/lib/uploads'

export const runtime = 'nodejs'

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

  const body = parseRegisterAssetInput(await request.json().catch(() => null))
  if (!body) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const result = await registerAsset(supabase, user.id, body)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({ assetId: result.assetId })
}
