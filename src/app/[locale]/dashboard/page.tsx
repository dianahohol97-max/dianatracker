import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/galleries'
import type { Gallery, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [{ data: galleries }, { data: profile }] = await Promise.all([
    supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Gallery[]>(),
    supabase.from('profiles').select('*').eq('user_id', user.id).single<Profile>(),
  ])

  const signOutWithLocale = signOut.bind(null, locale)

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-baseline justify-between border-b border-line pb-8">
        <h1 className="font-display text-4xl">{dict.dashboard.title}</h1>
        <div className="flex items-center gap-6">
          {profile && (
            <span className="text-sm text-muted">
              {dict.dashboard.storageUsed}: {formatBytes(profile.storage_used_bytes)} /{' '}
              {formatBytes(profile.storage_limit_bytes)}
            </span>
          )}
          <Link
            href={`/${locale}/dashboard/billing`}
            className="text-sm text-muted underline hover:text-fg"
          >
            {dict.dashboard.billingLink}
          </Link>
          <Link
            href={`/${locale}/dashboard/settings`}
            className="text-sm text-muted underline hover:text-fg"
          >
            {dict.dashboard.settingsLink}
          </Link>
          <form action={signOutWithLocale}>
            <button type="submit" className="text-sm text-muted underline hover:text-fg">
              {dict.common.signOut}
            </button>
          </form>
        </div>
      </header>

      <div className="mt-10">
        <Link
          href={`/${locale}/dashboard/galleries/new`}
          className="inline-block border border-fg px-8 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
        >
          {dict.dashboard.newGallery}
        </Link>
      </div>

      {!galleries || galleries.length === 0 ? (
        <p className="mt-16 max-w-xl leading-relaxed text-muted">{dict.dashboard.empty}</p>
      ) : (
        <ul className="mt-12 divide-y divide-line">
          {galleries.map((gallery) => (
            <li key={gallery.id}>
              <Link
                href={`/${locale}/dashboard/galleries/${gallery.id}`}
                className="flex items-baseline justify-between py-6 transition-colors hover:text-accent"
              >
                <span className="font-display text-2xl">{gallery.title}</span>
                <span className="text-sm text-muted">
                  {gallery.is_published ? dict.dashboard.published : dict.dashboard.draft}
                  {' · '}
                  {dict.dashboard.views}: {gallery.view_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
