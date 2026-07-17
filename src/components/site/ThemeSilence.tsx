import type { SiteContent } from '@/lib/site/content'
import { LeadForm, type LeadFormLabels } from './LeadForm'
import type { LangSwitch, PortfolioItem, SiteLabels } from './SiteRenderer'
import s from './SiteThemes.module.css'

/**
 * «Тиша» / «Опівніч» — the flagship layout: a full-bleed hero with a centred
 * caps-serif title, a staggered grayscale portfolio grid with numbered
 * captions, an inverted italic quote band for the bio, numbered pricing and a
 * centred contact block. Colours/fonts come from the --site-* vars on the
 * wrapper; this file owns the structure.
 */
export function ThemeSilence({
  content,
  displayName,
  logoUrl,
  portfolio,
  labels,
  langSwitch,
  leadForm,
}: {
  content: SiteContent
  displayName: string | null
  logoUrl: string | null
  portfolio: PortfolioItem[]
  labels: SiteLabels
  langSwitch?: LangSwitch
  leadForm?: { handle: string | null; labels: LeadFormLabels }
}) {
  const brand = displayName ?? ''
  const heroImg = portfolio[0]?.previewUrl ?? null
  const gridItems = heroImg ? portfolio.slice(1) : portfolio

  return (
    <div className={s.silence}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* nav */}
        <nav className={`${s.sNav} ${s.sPad}`}>
          <span className={s.sMono}>
            <a href="#portfolio">{labels.portfolio}</a>
            {' · '}
            <a href="#about">{labels.about}</a>
          </span>
          <span className={s.sWordmark}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brand} />
            ) : (
              brand
            )}
          </span>
          <span className={`${s.sMono} ${s.sNavRight}`}>
            {content.pricing.items.length > 0 && <a href="#pricing">{labels.pricing}</a>}
            <a href="#contact">{labels.contacts}</a>
            {langSwitch && (
              <span className={s.sLang}>
                <a
                  href={langSwitch.hrefUk}
                  style={{ opacity: langSwitch.current === 'uk' ? 1 : 0.5 }}
                >
                  UA
                </a>
                <a
                  href={langSwitch.hrefEn}
                  style={{ opacity: langSwitch.current === 'en' ? 1 : 0.5 }}
                >
                  EN
                </a>
              </span>
            )}
          </span>
        </nav>

        {/* full-bleed hero */}
        <header className={s.sHero}>
          <div
            className={s.sHeroImg}
            style={heroImg ? { backgroundImage: `url("${heroImg}")` } : undefined}
          />
          <div className={s.sHeroText}>
            <h1>{content.hero.title || brand}</h1>
            {content.hero.subtitle && <p>{content.hero.subtitle}</p>}
          </div>
          {portfolio.length > 0 && (
            <span className={`${s.sMono} ${s.sCorner} ${s.sCornerR}`}>{labels.portfolio} ↓</span>
          )}
        </header>

        {/* portfolio */}
        {portfolio.length > 0 && (
          <div className={s.sPad}>
            <div className={s.sLabels}>
              <span className={s.sMono}>{labels.portfolio}</span>
              <span className={s.sMono}>{portfolio.length}</span>
            </div>
            <section id="portfolio" className={s.sGrid}>
              {gridItems.map((item, index) => (
                <figure key={item.id} className={s.sWork}>
                  <div
                    className={s.sWorkImg}
                    style={
                      item.previewUrl
                        ? { backgroundImage: `url("${item.previewUrl}")` }
                        : undefined
                    }
                  />
                  <figcaption className={`${s.sMono} ${s.sWorkCap}`}>
                    {String(index + 1).padStart(2, '0')}
                  </figcaption>
                </figure>
              ))}
            </section>
          </div>
        )}

        {/* about — inverted quote band */}
        {content.about.text && (
          <section id="about" className={s.sBand}>
            <blockquote>{content.about.text}</blockquote>
          </section>
        )}

        {/* pricing — numbered staggered */}
        {content.pricing.items.length > 0 && (
          <div className={s.sPad}>
            <h2 id="pricing" className={s.sSvcHead}>
              {labels.pricing}
            </h2>
            <div className={s.sSvcGrid}>
              {content.pricing.items.map((item, index) => (
                <div key={item.name} className={s.sSvc}>
                  <span className={s.sSvcNo}>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{item.name}</h3>
                  {item.price && <p className={s.sPrice}>{item.price}</p>}
                  {item.includes.length > 0 && (
                    <ul>
                      {item.includes.map((line) => (
                        <li key={line}>— {line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* contact */}
        <div className={s.sPad}>
          <section id="contact" className={s.sContact}>
            <p className={s.sMono} style={{ marginBottom: 18 }}>
              {labels.contacts}
            </p>
            <div className={s.sContactRow}>
              {content.contact.email && (
                <a className={s.sEmail} href={`mailto:${content.contact.email}`}>
                  {content.contact.email}
                </a>
              )}
              {content.contact.phone && (
                <a href={`tel:${content.contact.phone}`} style={{ color: 'inherit', fontSize: 15 }}>
                  {content.contact.phone}
                </a>
              )}
              {content.contact.instagram && (
                <a
                  className={s.sMono}
                  href={`https://instagram.com/${content.contact.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--site-fg)', textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  @{content.contact.instagram.replace(/^@/, '')}
                </a>
              )}
              {content.contact.bookingUrl && (
                <a className={s.sBook} href={content.contact.bookingUrl}>
                  {labels.book}
                </a>
              )}
            </div>
            {leadForm && <LeadForm handle={leadForm.handle} labels={leadForm.labels} />}
          </section>
        </div>
      </div>
    </div>
  )
}
