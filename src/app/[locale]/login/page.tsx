'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { getDictionary, type Dictionary } from '@/lib/i18n'

export default function LoginPage() {
  const params = useParams<{ locale: string }>()
  const locale: Locale = isLocale(params.locale) ? params.locale : defaultLocale

  const [dict, setDict] = useState<Dictionary | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    void getDictionary(locale).then(setDict)
  }, [locale])

  if (!dict) return null

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    const supabase = createSupabaseBrowserClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?next=/${locale}/dashboard`,
      },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl">{dict.auth.title}</h1>

      {status === 'sent' ? (
        <p className="mt-8 leading-relaxed text-muted">{dict.auth.magicLinkSent}</p>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-muted" htmlFor="email">
            {dict.auth.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-transparent px-4 py-3 outline-none focus:border-fg"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-2 border border-fg px-6 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg disabled:opacity-50"
          >
            {dict.auth.magicLinkButton}
          </button>
          {status === 'error' && <p className="text-sm text-accent">{dict.auth.error}</p>}
        </form>
      )}
    </main>
  )
}
