import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, locales } from '@/lib/i18n/config'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Галереї для фотографів',
  description: 'Онлайн-галереї для передачі зйомок клієнтам.',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()

  return (
    <html lang={params.locale}>
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  )
}
