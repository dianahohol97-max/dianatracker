import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'

export default async function LandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const dict = await getDictionary(params.locale)

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-5xl leading-tight tracking-tight sm:text-6xl">
        {dict.landing.heroTitle}
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
        {dict.landing.heroSubtitle}
      </p>
      <Link
        href={`/${params.locale}/login`}
        className="mt-12 inline-block border border-fg px-10 py-4 text-sm uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg"
      >
        {dict.landing.cta}
      </Link>
    </main>
  )
}
