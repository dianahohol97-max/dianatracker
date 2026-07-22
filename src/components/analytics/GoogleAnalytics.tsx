import Script from 'next/script'

/**
 * Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is set (e.g.
 * "G-XXXXXXX"), so local/dev and un-configured deployments stay clean.
 * afterInteractive keeps it out of the critical render path.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
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
