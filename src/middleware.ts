import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n/config'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Two jobs:
 *   1. Locale routing — every page URL is prefixed with /uk or /en;
 *      bare paths redirect to the default locale (uk).
 *   2. Supabase session refresh on every matched request.
 * API routes and the auth callback are excluded from locale handling
 * by the matcher below.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (!hasLocale) {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  return updateSession(request, NextResponse.next({ request }))
}

export const config = {
  matcher: [
    // Everything except API routes, auth callback, Next internals and files.
    '/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
