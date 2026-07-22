import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Only allow same-origin, in-app redirect targets. Anything else — an absolute
 * URL, a protocol-relative `//evil.com`, a backslash trick — falls back to the
 * dashboard, so `?next=` can never bounce the freshly-authenticated visitor to
 * an attacker-controlled site (open redirect / token phishing).
 */
function safeNext(next: string | null): string {
  if (!next) return '/uk/dashboard'
  // Must be a single leading slash followed by a non-slash/backslash char.
  if (!/^\/[^/\\]/.test(next)) return '/uk/dashboard'
  return next
}

/** Magic-link landing: exchange the auth code for a session, then continue. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  if (code) {
    const supabase = createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
