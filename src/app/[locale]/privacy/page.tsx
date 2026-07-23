import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, locales } from '@/lib/i18n/config'
import { getLegalCopy } from '@/lib/legal/copy'
import { LegalDocView } from '@/components/legal/LegalDocView'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const copy = getLegalCopy(isLocale(params.locale) ? params.locale : 'uk')
  return {
    title: copy.privacy.title,
    description: copy.privacy.intro.slice(0, 155),
    alternates: { canonical: `/${params.locale}/privacy` },
  }
}

export default function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const copy = getLegalCopy(params.locale)
  return (
    <LegalDocView
      doc={copy.privacy}
      locale={params.locale}
      backLabel={copy.backToHome}
      reviewNote={copy.reviewNote}
    />
  )
}
