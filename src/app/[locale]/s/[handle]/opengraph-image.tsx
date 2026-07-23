import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { localizedSiteContent, parseSiteContent } from '@/lib/site/content'
import { isThemeId, resolveTokens, type SiteMode } from '@/lib/site/themes'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Photographer portfolio'

// Brand fonts (static instances) read from disk. next.config.js force-includes
// this folder in the OG route's Vercel function bundle.
const fontsDir = join(process.cwd(), 'src/assets/fonts')
const manropeData = readFileSync(join(fontsDir, 'Manrope-Regular.ttf'))
const manropeSemiData = readFileSync(join(fontsDir, 'Manrope-SemiBold.ttf'))
const unboundedData = readFileSync(join(fontsDir, 'Unbounded-SemiBold.ttf'))

interface SiteRow {
  theme: string
  mode: string
  content: unknown
  display_name: string | null
  logo_key: string | null
}

/**
 * Social share card for a photographer's site. Rendered in the site's own
 * theme colours and the viewer's language — and, true to the zero-branding
 * promise, it carries the PHOTOGRAPHER's name only, never «проЯв».
 */
export default async function Image({
  params,
}: {
  params: { locale: string; handle: string }
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let site: SiteRow | null = null
  if (url && anon) {
    try {
      const supabase = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data } = await supabase.rpc('get_site', { p_handle: params.handle })
      site = (data as SiteRow[] | null)?.[0] ?? null
    } catch {
      /* fall through to a neutral card */
    }
  }

  const theme = site && isThemeId(site.theme) ? site.theme : 'tysha'
  const mode: SiteMode = site?.mode === 'night' ? 'night' : 'light'
  const t = resolveTokens(theme, mode)

  const content = site ? localizedSiteContent(parseSiteContent(site.content), params.locale) : null
  const brand = (site?.display_name ?? '').trim()
  const title = (content?.hero.title || brand || params.handle).slice(0, 90)
  const subtitle = (content?.hero.subtitle ?? '').slice(0, 120)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: t.bg,
          color: t.fg,
          padding: 80,
          fontFamily: 'Manrope',
        }}
      >
        {/* top: brand + accent rule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {brand ? (
            <div
              style={{
                fontFamily: 'ManropeSemi',
                fontSize: 26,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: t.muted,
              }}
            >
              {brand}
            </div>
          ) : null}
          <div style={{ width: 96, height: 4, background: t.accent }} />
        </div>

        {/* middle: the headline */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'Unbounded',
            fontSize: title.length > 42 ? 64 : 88,
            lineHeight: 1.05,
            letterSpacing: -1,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* bottom: subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: t.muted,
            maxWidth: 980,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Manrope', data: manropeData, weight: 400, style: 'normal' },
        { name: 'ManropeSemi', data: manropeSemiData, weight: 600, style: 'normal' },
        { name: 'Unbounded', data: unboundedData, weight: 600, style: 'normal' },
      ],
    }
  )
}
