'use client'

import { useState } from 'react'
import type { BillingPeriod, GalleryPlan, SitePlan } from '@/lib/plans'
import type { Locale } from '@/lib/i18n/config'

export interface PlanCard {
  id: string
  name: string
  note: string
  storageLine: string
  priceMonth: number
  priceYear: number
  features: string[]
  isCurrent: boolean
  isFree: boolean
  highlight?: boolean
}

interface Labels {
  periodMonth: string
  periodYear: string
  upgrade: string
  currentBadge: string
  perMonth: string
  perYear: string
  freePrice: string
  notConfigured: string
}

export function buildGalleryCard(
  plan: GalleryPlan,
  name: string,
  note: string,
  storageLine: string,
  features: string[],
  currentPlan: string
): PlanCard {
  return {
    id: plan.id,
    name,
    note,
    storageLine,
    priceMonth: plan.priceUahMonth,
    priceYear: plan.priceUahYear,
    features,
    isCurrent: plan.id === currentPlan,
    isFree: plan.priceUahMonth === 0,
    highlight: plan.id === 'plus',
  }
}

export function buildSiteCard(
  plan: SitePlan,
  name: string,
  note: string,
  currentSitePlan: string
): PlanCard {
  return {
    id: plan.id,
    name,
    note,
    storageLine: '',
    priceMonth: plan.priceUahMonth,
    priceYear: plan.priceUahYear,
    features: [],
    isCurrent: plan.id === currentSitePlan,
    isFree: plan.priceUahMonth === 0,
  }
}

/** Shared plan grid for both products with a month/year toggle. */
export function BillingPlans({
  cards,
  locale,
  labels,
  columns = 3,
}: {
  cards: PlanCard[]
  locale: Locale
  labels: Labels
  columns?: number
}) {
  const [period, setPeriod] = useState<BillingPeriod>('month')
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function upgrade(planId: string) {
    setBusy(true)
    setNotice(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, period, locale }),
      })
      if (response.status === 503) {
        setNotice(labels.notConfigured)
        return
      }
      if (!response.ok) throw new Error(`checkout ${response.status}`)
      const form = (await response.json()) as { url: string; fields: Record<string, string> }

      const element = document.createElement('form')
      element.method = 'POST'
      element.action = form.url
      for (const [name, value] of Object.entries(form.fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value
        element.appendChild(input)
      }
      document.body.appendChild(element)
      element.submit()
    } catch {
      setNotice(labels.notConfigured)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="inline-flex rounded border border-line text-sm">
        {(['month', 'year'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              period === value ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
            }`}
          >
            {value === 'month' ? labels.periodMonth : labels.periodYear}
          </button>
        ))}
      </div>

      <div
        className="mt-8 grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, maxWidth: columns * 340 }}
      >
        {cards.map((card) => {
          const price = period === 'month' ? card.priceMonth : card.priceYear
          return (
            <div
              key={card.id}
              className={`flex flex-col rounded border p-6 ${
                card.highlight ? 'border-fg' : 'border-line'
              }`}
            >
              <h3 className="font-brand text-xl">{card.name}</h3>
              {card.storageLine && <p className="mt-1 text-sm text-muted">{card.storageLine}</p>}
              <p className="mt-5 font-brand text-3xl">
                {card.isFree ? labels.freePrice : `${price} ₴`}
                {!card.isFree && (
                  <span className="font-body text-xs text-muted">
                    {' '}
                    {period === 'month' ? labels.perMonth : labels.perYear}
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-muted">{card.note}</p>
              {card.features.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <span className="text-accent">→</span> {feature}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-6">
                {card.isCurrent ? (
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">
                    {labels.currentBadge}
                  </span>
                ) : card.isFree ? null : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void upgrade(card.id)}
                    className="rounded-full border border-fg px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
                  >
                    {labels.upgrade}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {notice && <p className="mt-6 text-sm text-muted">{notice}</p>}
    </div>
  )
}
