import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getLandingCopy } from '@/lib/landing/copy'
import { PLANS } from '@/lib/plans'
import { Logo } from '@/components/Logo'
import { Reveal } from '@/components/landing/Reveal'
import s from './landing.module.css'

export default function LandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const t = getLandingCopy(locale)
  const login = `/${locale}/login`

  const marqueeTiles = ['g1 t34', 'g4 t43', 'g2 t11', 'g5 t34', 'g3 t43', 'g1 t11', 'g2 t34', 'g4 t43']
  const tile = (spec: string, key: number) => {
    const [g, t_] = spec.split(' ')
    return <div key={key} className={`${s.ph} ${s[g]} ${s[t_]}`} />
  }

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        {/* ---------- nav ---------- */}
        <nav className={s.nav}>
          <Link href={`/${locale}`} className="text-fg no-underline">
            <Logo />
          </Link>
          <span className={s.navLinks}>
            <a href="#products">{t.nav.features}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <Link href={login}>{t.nav.signIn}</Link>
            <Link href={login} className={s.pillHot}>
              {t.nav.ctaShort} <span>→</span>
            </Link>
          </span>
        </nav>

        {/* ---------- hero ---------- */}
        <header className={s.hero}>
          <div>
            <div className={s.chips}>
              {t.hero.chips.map((chip, index) => (
                <span key={chip} className={index === 0 ? s.chipOn : s.chip}>
                  {chip}
                </span>
              ))}
            </div>
            <h1 className={s.h1}>
              {t.hero.titleBefore}
              <em>{t.hero.titleAccent}</em>
              {t.hero.titleAfter}
            </h1>
            <p className={s.lede}>{t.hero.lede}</p>
            <div className={s.ctaRow}>
              <Link href={login} className={s.pillHot}>
                {t.hero.cta} <span>→</span>
              </Link>
              <span className={s.ctaNote}>{t.hero.ctaNote}</span>
            </div>
          </div>
          <div className={s.stage} aria-hidden="true">
            <div className={s.mockGallery}>
              <div className={s.mockGrid}>
                <div className={`${s.ph} ${s.g1}`} />
                <div className={`${s.ph} ${s.g3}`} />
                <div className={`${s.ph} ${s.g4}`} />
                <div className={`${s.ph} ${s.g2}`} />
              </div>
              <span className={s.heart}>♥</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statNum}>
                {t.hero.statNumber}
                <i>+</i>
              </span>
              <p>{t.hero.statText}</p>
            </div>
            <div className={s.mockBooking}>
              <div className={s.slot}>
                <span>Сб, 14:00</span>
                <span>2 000 ₴</span>
              </div>
              <div className={s.slotOn}>
                <span>Сб, 17:00</span>
                <span>2 000 ₴</span>
              </div>
              <div className={s.pay}>{t.hero.slotPay}</div>
            </div>
            <div className={s.themeChip}>
              <div className={s.wm}>{t.hero.mockName}</div>
              <div className={s.hl}>{t.hero.mockTitle}</div>
              <div className={s.themeRow}>
                <div className={`${s.ph} ${s.g2}`} />
                <div className={`${s.ph} ${s.g5}`} />
                <div className={`${s.ph} ${s.g3}`} />
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ---------- marquee ---------- */}
      <div className={s.stripZone} aria-hidden="true">
        <div className={s.marquee}>
          {marqueeTiles.map(tile)}
          {marqueeTiles.map((spec, index) => tile(spec, index + 100))}
        </div>
      </div>

      <div className={s.wrap}>
        {/* ---------- products ---------- */}
        <section className={s.products} id="products">
          <Reveal>
            <div className={s.secHead}>
              <span className={s.lbl}>{t.products.label}</span>
              <h2 className={s.h2}>
                {t.products.titleBefore}
                <span className={s.accentWord}>{t.products.titleAccent}</span>
              </h2>
              <p>{t.products.lede}</p>
            </div>
          </Reveal>
          <div className={s.prodGrid}>
            <Reveal>
              <div className={s.prod}>
                <span className={s.prodNo}>{t.products.items[0].no}</span>
                <div className={s.pGal}>
                  <div className={`${s.ph} ${s.g1}`} />
                  <div className={`${s.ph} ${s.g3}`} />
                  <div className={`${s.ph} ${s.g4}`} />
                  <div className={`${s.ph} ${s.g2}`} />
                </div>
                <h3>{t.products.items[0].title}</h3>
                <p>{t.products.items[0].text}</p>
                <p className={s.tag}>
                  <b>{t.products.items[0].tagStrong}</b>
                  {t.products.items[0].tagRest}
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className={s.prod}>
                <span className={s.prodNo}>{t.products.items[1].no}</span>
                <div className={s.pSite}>
                  <div className={s.wm}>{t.hero.mockName}</div>
                  <div className={s.hl}>{t.hero.mockTitle}</div>
                  <div className={s.themeRow}>
                    <div className={`${s.ph} ${s.g2}`} />
                    <div className={`${s.ph} ${s.g4}`} />
                    <div className={`${s.ph} ${s.g1}`} />
                  </div>
                </div>
                <h3>{t.products.items[1].title}</h3>
                <p>{t.products.items[1].text}</p>
                <p className={s.tag}>
                  <b>{t.products.items[1].tagStrong}</b>
                  {t.products.items[1].tagRest}
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className={s.prod}>
                <span className={s.prodNo}>{t.products.items[2].no}</span>
                <div className={s.pBook}>
                  <div className={s.slot}>
                    <span>Сб, 14:00 · 60 хв</span>
                    <span>2 000 ₴</span>
                  </div>
                  <div className={s.slotOn}>
                    <span>Сб, 17:00 · 60 хв</span>
                    <span>2 000 ₴</span>
                  </div>
                  <div className={s.ok}>✓</div>
                </div>
                <h3>{t.products.items[2].title}</h3>
                <p>{t.products.items[2].text}</p>
                <p className={s.tag}>
                  <b>{t.products.items[2].tagStrong}</b>
                  {t.products.items[2].tagRest}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- bento ---------- */}
        <section className={s.bento}>
          <Reveal>
            <div className={s.secHead}>
              <span className={s.lbl}>{t.bento.label}</span>
              <h2 className={s.h2}>
                {t.bento.titleBefore}
                <span className={s.accentWord}>{t.bento.titleAccent}</span>
              </h2>
            </div>
          </Reveal>
          <div className={s.bentoGrid}>
            <div className={s.bTall}>
              <span className={s.lbl}>{t.bento.cards.selection.label}</span>
              <h4>{t.bento.cards.selection.text}</h4>
            </div>
            <div className={s.b}>
              <div className={`${s.ph} ${s.g3} ${s.bPhoto}`} />
              <div className={s.over}>
                <span className={s.lbl}>{t.bento.cards.galleryPhoto}</span>
              </div>
            </div>
            <div className={s.b}>
              <span className={s.lbl}>{t.bento.cards.protection.label}</span>
              <h4>{t.bento.cards.protection.text}</h4>
            </div>
            <div className={s.bCoal}>
              <span className={s.lbl}>{t.bento.cards.archive.label}</span>
              <h4>{t.bento.cards.archive.text}</h4>
            </div>
            <div className={s.bHot}>
              <span className={s.lbl}>{t.bento.cards.payments.label}</span>
              <h4>{t.bento.cards.payments.text}</h4>
            </div>
            <div className={s.b}>
              <span className={s.lbl}>{t.bento.cards.stats.label}</span>
              <span className={s.big}>{t.bento.cards.stats.number}</span>
              <h4 className={s.bMutedText}>{t.bento.cards.stats.text}</h4>
            </div>
            <div className={s.b}>
              <span className={s.lbl}>{t.bento.cards.themes.label}</span>
              <h4>{t.bento.cards.themes.text}</h4>
              <div className={s.chipsMini}>
                {t.bento.cards.themes.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
            <div className={s.b}>
              <div className={`${s.ph} ${s.g5} ${s.bPhoto}`} />
              <div className={s.over}>
                <span className={s.lbl}>{t.bento.cards.previewPhoto}</span>
              </div>
            </div>
            <div className={s.b}>
              <span className={s.lbl}>{t.bento.cards.autoRelease.label}</span>
              <h4>{t.bento.cards.autoRelease.text}</h4>
            </div>
            <div className={s.bWide}>
              <span className={s.lbl}>{t.bento.cards.video.label}</span>
              <h4>{t.bento.cards.video.text}</h4>
            </div>
            <div className={s.b}>
              <span className={s.lbl}>{t.bento.cards.email.label}</span>
              <h4>{t.bento.cards.email.text}</h4>
            </div>
          </div>
        </section>
      </div>

      {/* ---------- principles ---------- */}
      <section className={s.principles}>
        <div className={s.wrap}>
          <h2 className={s.huge} aria-hidden="true">
            {t.principles.huge}
          </h2>
          <Reveal>
            <div className={s.secHead}>
              <h2 className={s.h2}>{t.principles.title}</h2>
              <p>{t.principles.lede}</p>
            </div>
          </Reveal>
          <Reveal>
            <div className={s.prGrid}>
              {t.principles.items.map((item) => (
                <div key={item.title}>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className={s.wrap}>
        {/* ---------- pricing ---------- */}
        <section className={s.pricing} id="pricing">
          <Reveal>
            <div className={s.secHead}>
              <span className={s.lbl}>{t.pricing.label}</span>
              <h2 className={s.h2}>
                {t.pricing.titleBefore}
                <span className={s.accentWord}>{t.pricing.titleAccent}</span>
              </h2>
              <p>{t.pricing.lede}</p>
            </div>
          </Reveal>
          <div className={s.plans}>
            <div className={s.plan}>
              <h3>{t.pricing.freeName}</h3>
              <p className={s.gb}>{t.pricing.storage(PLANS.free.storageGb)}</p>
              <p className={s.price}>
                0 ₴<small> {t.pricing.freePeriod}</small>
              </p>
              <p className={s.yr}>{t.pricing.freeNote}</p>
              <ul>
                {t.pricing.freeItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={login} className={`${s.pillGhost} ${s.planCta}`}>
                {t.pricing.freeCta}
              </Link>
            </div>
            <div className={s.planHot}>
              <span className={s.popular}>{t.pricing.popular}</span>
              <h3>{t.pricing.startName}</h3>
              <p className={s.gb}>{t.pricing.storage(PLANS.start.storageGb)}</p>
              <p className={s.price}>
                {PLANS.start.priceUahMonth} ₴<small> {t.pricing.perMonth}</small>
              </p>
              <p className={s.yr}>{t.pricing.yearHint(String(PLANS.start.priceUahYear))}</p>
              <ul>
                {t.pricing.startItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={login} className={`${s.pillHot} ${s.planCta}`}>
                {t.pricing.startCta} <span>→</span>
              </Link>
            </div>
            <div className={s.plan}>
              <h3>{t.pricing.proName}</h3>
              <p className={s.gb}>{t.pricing.storage(PLANS.pro.storageGb)}</p>
              <p className={s.price}>
                {PLANS.pro.priceUahMonth} ₴<small> {t.pricing.perMonth}</small>
              </p>
              <p className={s.yr}>{t.pricing.yearHint(String(PLANS.pro.priceUahYear))}</p>
              <ul>
                {t.pricing.proItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={login} className={`${s.pillGhost} ${s.planCta}`}>
                {t.pricing.proCta}
              </Link>
            </div>
          </div>
          <p className={s.fineprint}>{t.pricing.fineprint}</p>
        </section>

        {/* ---------- faq ---------- */}
        <section className={s.faq}>
          <Reveal>
            <div className={s.secHead}>
              <span className={s.lbl}>{t.faq.label}</span>
              <h2 className={s.h2}>{t.faq.title}</h2>
            </div>
          </Reveal>
          <div className={s.faqList}>
            {t.faq.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- final ---------- */}
      <section className={s.final}>
        <span className={s.lbl}>{t.final.label}</span>
        <h2 className={s.finalH2}>
          {t.final.titleBefore}
          <span className={s.accentWord}>{t.final.titleAccent}</span>
        </h2>
        <Link href={login} className={s.pillHot}>
          {t.final.cta} <span>→</span>
        </Link>
        <div className={s.giant} aria-hidden="true">
          Прояв<i>.</i>
        </div>
      </section>

      <div className={s.wrap}>
        <footer className={s.footer}>
          <Logo size={17} textSize={13} />
          <span>{t.footer.tagline}</span>
          <span>{t.footer.links}</span>
        </footer>
      </div>
    </main>
  )
}
