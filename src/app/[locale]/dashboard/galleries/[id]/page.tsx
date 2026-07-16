import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteGallery, setGalleryPublished } from '@/lib/actions/galleries'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { getStorage } from '@/lib/storage'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { Uploader } from '@/components/Uploader'
import type { Asset, Gallery } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ManageGalleryPage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: gallery } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single<Gallery>()
  if (!gallery) notFound()

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('position')
    .order('created_at')
    .returns<Asset[]>()

  // Short-lived previews for the owner's thumbnails — signed server-side,
  // fetched by the browser straight from R2.
  const storage = getStorage()
  const previews = await Promise.all(
    (assets ?? []).map(async (asset) => ({
      asset,
      url: await storage.getSignedReadUrl(asset.variants.preview ?? asset.r2_key, {
        expiresInSeconds: 60 * 60,
      }),
    }))
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const publicUrl = `${appUrl}/${locale}/g/${gallery.slug}`

  const publishAction = setGalleryPublished.bind(null, locale, gallery.id, !gallery.is_published)
  const deleteAction = deleteGallery.bind(null, locale, gallery.id)

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href={`/${locale}/dashboard`} className="text-sm text-muted hover:text-fg">
        ← {dict.dashboard.title}
      </Link>

      <header className="mt-6 border-b border-line pb-8">
        <h1 className="font-display text-4xl">{gallery.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          {gallery.is_published ? dict.galleryManage.publishedHint : dict.galleryManage.draftHint}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <form action={publishAction}>
            <button
              type="submit"
              className="border border-fg px-6 py-2 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
            >
              {gallery.is_published ? dict.galleryManage.unpublish : dict.galleryManage.publish}
            </button>
          </form>

          {gallery.is_published && (
            <CopyLinkButton
              url={publicUrl}
              label={dict.galleryManage.copyLink}
              copiedLabel={dict.galleryManage.copied}
            />
          )}

          <span className="text-sm text-muted">
            {dict.dashboard.views}: {gallery.view_count} · {dict.dashboard.photosCount}:{' '}
            {assets?.length ?? 0}
          </span>
        </div>

        {gallery.is_published && (
          <p className="mt-4 break-all text-sm text-muted">
            {dict.galleryManage.publicLink}: {publicUrl}
          </p>
        )}
      </header>

      <section className="mt-12">
        <h2 className="font-display text-2xl">{dict.galleryManage.uploadTitle}</h2>
        <div className="mt-6">
          <Uploader galleryId={gallery.id} dropHint={dict.galleryManage.dropHint} />
        </div>
      </section>

      <section className="mt-12">
        {previews.length === 0 ? (
          <p className="max-w-xl leading-relaxed text-muted">{dict.galleryManage.noAssets}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {previews.map(({ asset, url }) => (
              <div key={asset.id} className="aspect-square overflow-hidden bg-line">
                {asset.kind === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={url} className="h-full w-full object-cover" muted />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-line pt-8">
        <form action={deleteAction}>
          <button type="submit" className="text-sm text-accent underline">
            {dict.galleryManage.deleteGallery}
          </button>
          <p className="mt-2 max-w-md text-xs text-muted">{dict.galleryManage.deleteConfirm}</p>
        </form>
      </section>
    </main>
  )
}
