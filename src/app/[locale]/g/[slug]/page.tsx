import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { isGalleryUnlocked } from '@/lib/gallery-access'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DownloadAllButton } from '@/components/DownloadAllButton'
import { GalleryGrid, type GridItem } from '@/components/GalleryGrid'
import type { Asset } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * The client-facing gallery. Zero interface chrome, zero our-brand marks —
 * only the photographer's work (and later their logo). Reads run as anon
 * under RLS, which only exposes published, non-expired galleries.
 */
export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string }
  searchParams: { error?: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()

  // Explicit column list — password_hash must never reach the page props.
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, slug, title, description, event_date, password_hash, is_published')
    .eq('slug', params.slug)
    .single<{
      id: string
      slug: string
      title: string
      description: string | null
      event_date: string | null
      password_hash: string | null
      is_published: boolean
    }>()

  if (!gallery) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 text-center">
        <p className="leading-relaxed text-muted">{dict.publicGallery.notFound}</p>
      </main>
    )
  }

  if (!isGalleryUnlocked(gallery)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="font-display text-3xl">{gallery.title}</h1>
        <p className="mt-4 text-muted">{dict.publicGallery.passwordTitle}</p>
        <form method="post" action={`/api/galleries/${gallery.slug}/unlock`} className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="text-sm text-muted" htmlFor="password">
            {dict.publicGallery.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border border-line bg-transparent px-4 py-3 outline-none focus:border-fg"
          />
          {searchParams.error === 'password' && (
            <p className="text-sm text-accent">{dict.publicGallery.passwordError}</p>
          )}
          <button
            type="submit"
            className="mt-2 border border-fg px-6 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
          >
            {dict.publicGallery.passwordSubmit}
          </button>
        </form>
      </main>
    )
  }

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('position')
    .order('created_at')
    .returns<Asset[]>()

  // Presigned preview URLs, generated server-side; the browser loads media
  // straight from R2. Falls back to the original until variants exist.
  const storage = getStorage()
  const items: GridItem[] = await Promise.all(
    (assets ?? []).map(async (asset) => ({
      id: asset.id,
      kind: asset.kind,
      width: asset.width,
      height: asset.height,
      previewUrl: await storage.getSignedReadUrl(asset.variants.preview ?? asset.r2_key, {
        expiresInSeconds: 60 * 60,
      }),
      downloadHref: `/api/assets/${asset.id}/download`,
    }))
  )

  // Basic stats: count the view (fire-and-forget semantics, errors ignored).
  await supabase.rpc('record_gallery_view', { gallery_slug: gallery.slug })

  // This client's current favorites (scoped by the middleware-minted token).
  const clientToken = cookies().get('ct')?.value
  let initialFavorites: string[] = []
  if (clientToken) {
    const { data: selections } = await supabase
      .from('selections')
      .select('asset_id')
      .eq('gallery_id', gallery.id)
      .eq('client_token', clientToken)
      .eq('kind', 'favorite')
    initialFavorites = (selections ?? []).map((s: { asset_id: string }) => s.asset_id)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <header className="mb-16 text-center">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{gallery.title}</h1>
        {gallery.event_date && (
          <p className="mt-4 text-sm uppercase tracking-widest text-muted">
            {new Date(gallery.event_date).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        {gallery.description && (
          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-muted">
            {gallery.description}
          </p>
        )}
        {items.length > 0 && (
          <div className="mt-8">
            <DownloadAllButton
              slug={gallery.slug}
              label={dict.publicGallery.downloadAll}
              progressLabel={dict.publicGallery.preparingArchive}
              errorLabel={dict.publicGallery.archiveError}
            />
          </div>
        )}
      </header>

      <GalleryGrid
        items={items}
        slug={gallery.slug}
        downloadLabel={dict.publicGallery.downloadOriginal}
        favoriteLabel={dict.publicGallery.favoriteToggle}
        initialFavorites={initialFavorites}
      />
    </main>
  )
}
