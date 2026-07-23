# Voyantic — multilingual travel affiliate site

Production-ready, multilingual (en / de / pl / uk) travel content site with
affiliate monetization. Built for SEO visibility, speed, and conversion.

> **Status:** Phase 1 (foundation) complete. See "Roadmap" below.

## Stack

- **Next.js 15** (App Router, TypeScript strict, `strict: true`, no `any`)
- **Tailwind CSS v4** (`@tailwindcss/postcss`, theme via `@theme`)
- **MDX** for content (Phase 2 — `next-mdx-remote/rsc`)
- **Supabase** for email subscriptions, click log, and tool-data cache (Phase 4+)
- SSG by default, ISR for data pages

## Content model — three layers

1. **Guides** — deep, research-based practical destination content (the bulk).
2. **Data pages** — visas, trip costs, transport, seasonality. Verified, ISR-refreshed.
3. **Tools** — calculators and planners that AI search can't paraphrase.

## Local development

```bash
cd travel
cp .env.example .env.local   # fill in as needed
npm install
npm run dev                  # http://localhost:3000 → redirects to /en
```

Scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (SSG) |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run check:i18n` | Fails if locale message files drift out of key parity |

## i18n

- Routes are locale-prefixed: `/en`, `/de`, `/pl`, `/uk`. Default is `en`.
- **No automatic IP / browser-language redirect** — only a dismissible banner suggests another language.
- Full `hreflang` + `x-default` on `/en`.
- All UI strings live in `/messages/{locale}.json`. Never hardcode UI text in components.
- Dates / numbers / currencies are formatted per-locale via `src/lib/locale.ts` (`Intl`).

### Adding a UI string

1. Add the key to **all four** files in `/messages`.
2. Read it with `getTranslator(locale)` in a Server Component, or pass the
   resolved string down to Client Components.
3. Run `npm run check:i18n` to confirm parity.

## Project structure

```
travel/
  messages/{en,de,pl,uk}.json   # UI strings (parity-checked)
  scripts/check-i18n.ts         # parity guard
  src/
    i18n/config.ts              # locales, defaultLocale, per-locale meta
    i18n/messages.ts            # server-side message loader + getTranslator
    lib/locale.ts               # Intl currency/date/number + localeHref
    middleware.ts               # locale-prefix enforcement (no geo redirect)
    app/
      layout.tsx                # pass-through root layout
      not-found.tsx             # global 404 (x-default / en)
      globals.css               # Tailwind v4 + theme tokens
      [locale]/layout.tsx       # <html lang>, header/footer, metadata+hreflang
      [locale]/page.tsx         # home
    components/                 # Header, Footer, LanguageSwitcher, Container
```

## Roadmap

- **Phase 1 — foundation** ✅ i18n routing, layout, header/footer, switcher, messages.
- **Phase 2 — content pipeline** MDX + Zod frontmatter (incl. `sources`, `dataCheckedAt`), `translationKey` links, image layer with attribution.
- **Phase 3 — pages & components** Route table (destinations, guides, data, tools, about…) and MDX components (`FactBox`, `PriceTable`, `TourCard`, `FAQ`, …).
- **Phase 4 — affiliate layer** `data/affiliates.ts`, `<AffiliateLink>`, `<AffiliateDisclosure>`, Stay22, click tracking, GYG/Viator API.
- **Phase 5 — tools** Budget calculator, trip planner, car-rental compare.
- **Phase 6 — SEO** JSON-LD, sitemap, hreflang, robots, OG, RSS.
- **Phase 7 — analytics, GDPR, deploy.**

## Editorial standard (read before generating content)

Content is written from **research, not personal experience**. Every factual
claim carries a source (`sources: [{title, url, checkedAt}]` in frontmatter);
`dataCheckedAt` is updated for real when facts are re-verified. No invented
first-person travel experiences, no numbers without a source, no AI-generated
photos of real places. See Phase 2 for the enforced frontmatter schema.
