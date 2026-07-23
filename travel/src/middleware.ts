import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { defaultLocale, isLocale, locales } from './i18n/config';

/**
 * Locale-prefix middleware.
 *
 * Every public route is prefixed with a locale (`/en`, `/de`, `/pl`, `/uk`).
 * When a request arrives without a locale prefix we redirect to the DEFAULT
 * locale (`en`) — deliberately NOT to a language guessed from IP or the
 * Accept-Language header (spec §4: no automatic geo/browser redirect). The
 * client-side banner is the only mechanism that suggests another language.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // Guard: if the first segment merely *looks* like a locale but isn't valid,
  // still fall through to the default-locale redirect below.
  const firstSegment = pathname.split('/')[1] ?? '';
  if (firstSegment && isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes, and anything with a file extension
  // (static assets, sitemap.xml, robots.txt, og images, etc.).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
