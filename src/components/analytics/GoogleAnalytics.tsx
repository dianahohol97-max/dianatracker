import Script from 'next/script'

/** proiav.space GA4 stream; override per-environment with NEXT_PUBLIC_GA_ID. */
const DEFAULT_GA_ID = 'G-VV417KX665'

/**
 * Google Analytics 4. Uses NEXT_PUBLIC_GA_ID when set, otherwise the
 * production stream above. A Measurement ID is public (it ships in every
 * page's HTML), so hardcoding the default is safe. afterInteractive keeps it
 * out of the critical render path.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID || DEFAULT_GA_ID
  if (!id) return null
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  )
}
