import { NextResponse, type NextRequest } from 'next/server'
import { unlockCookieName, unlockCookieValue } from '@/lib/gallery-access'
import { verifyPassword } from '@/lib/password'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Password gate for public galleries. On a correct password the response sets
 * an httpOnly HMAC cookie and redirects back to the gallery page.
 * Note: password_hash is readable here because the request runs server-side;
 * public pages never select that column into client-visible props.
 */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const formData = await request.formData()
  const password = String(formData.get('password') ?? '')
  const locale = String(formData.get('locale') ?? 'uk')
  const galleryUrl = new URL(`/${locale}/g/${params.slug}`, request.url)

  const supabase = createSupabaseServerClient()
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, password_hash')
    .eq('slug', params.slug)
    .single()

  if (!gallery) {
    return NextResponse.redirect(galleryUrl, { status: 303 })
  }

  if (gallery.password_hash && !verifyPassword(password, gallery.password_hash)) {
    galleryUrl.searchParams.set('error', 'password')
    return NextResponse.redirect(galleryUrl, { status: 303 })
  }

  const response = NextResponse.redirect(galleryUrl, { status: 303 })
  response.cookies.set(unlockCookieName(gallery.id), unlockCookieValue(gallery.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}
