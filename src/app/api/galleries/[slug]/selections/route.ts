import { NextResponse, type NextRequest } from 'next/server'
import { isGalleryUnlocked } from '@/lib/gallery-access'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SelectionKind } from '@/lib/types'

export const runtime = 'nodejs'

interface ToggleBody {
  assetId: string
  kind: SelectionKind
  selected: boolean
}

function isToggleBody(value: unknown): value is ToggleBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.assetId === 'string' &&
    (v.kind === 'favorite' || v.kind === 'retouch') &&
    typeof v.selected === 'boolean'
  )
}

/**
 * Client photo selection ("favorites" / "send to retouch") — no registration.
 * Identity is the `ct` cookie minted by the middleware; RLS only allows
 * writes into published, non-expired galleries.
 */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const clientToken = request.cookies.get('ct')?.value
  if (!clientToken) {
    return NextResponse.json({ error: 'no_client_token' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isToggleBody(body)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, password_hash')
    .eq('slug', params.slug)
    .single()
  if (!gallery) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (!isGalleryUnlocked(gallery)) {
    return NextResponse.json({ error: 'locked' }, { status: 403 })
  }

  if (body.selected) {
    const { error } = await supabase.from('selections').upsert(
      {
        gallery_id: gallery.id,
        asset_id: body.assetId,
        client_token: clientToken,
        kind: body.kind,
      },
      { onConflict: 'asset_id,client_token,kind', ignoreDuplicates: true }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('selections')
      .delete()
      .eq('asset_id', body.assetId)
      .eq('client_token', clientToken)
      .eq('kind', body.kind)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
