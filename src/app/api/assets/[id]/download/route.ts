import { NextResponse, type NextRequest } from 'next/server'
import { isGalleryUnlocked } from '@/lib/gallery-access'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * "Download original" — the only place the original file is handed out.
 * We redirect to a short-lived presigned R2 URL (bytes never touch Vercel)
 * and log a download event for gallery stats.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()

  // RLS gates visibility: the owner sees their assets; anon sees assets of
  // published, non-expired galleries only.
  const { data: asset } = await supabase
    .from('assets')
    .select('id, r2_key, gallery_id, owner_id, galleries!inner(id, password_hash)')
    .eq('id', params.id)
    .single()

  if (!asset) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const gallery = Array.isArray(asset.galleries) ? asset.galleries[0] : asset.galleries

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === asset.owner_id

  if (!isOwner && !isGalleryUnlocked({ id: gallery.id, password_hash: gallery.password_hash })) {
    return NextResponse.json({ error: 'locked' }, { status: 403 })
  }

  const fileName = asset.r2_key.split('/').pop() ?? 'photo.jpg'
  const url = await getStorage().getSignedReadUrl(asset.r2_key, {
    expiresInSeconds: 5 * 60,
    downloadFileName: fileName.replace(/^[0-9a-f-]{37}/, ''), // strip the uuid- prefix
  })

  if (!isOwner) {
    await supabase.rpc('record_gallery_download', {
      gid: asset.gallery_id,
      asset: asset.id,
    })
  }

  return NextResponse.redirect(url, { status: 302 })
}
