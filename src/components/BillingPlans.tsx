'use client'

import { useState } from 'react'
import type { BillingPeriod, Plan, PlanId } from '@/lib/plans'
import type { Locale } from '@/lib/i18n/config'

interface Labels {
  periodMonth: string
  periodYear: string
  planNames: Record<PlanId, string>
  storage: string
  upgrade: string
  currentBadge: string
  perMonth: string
  perYear: string
  freePrice: string
  notConfigured: string
}

export function BillingPlans({
  plans,
  currentPlan,
  locale,
  labels,
}: {
  plans: Plan[]
  currentPlan: string
  locale: Locale
  labels: Labels
}) {
  const [period, setPeriod] = useState<BillingPeriod>('month')
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function upgrade(planId: PlanId) {
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

      // Auto-submit the provider's hosted checkout form.
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
      <div className="flex gap-0 border border-line text-sm">
        {(['month', 'year'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`flex-1 px-6 py-2.5 uppercase tracking-widest transition-colors ${
              period === value ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
            }`}
          >
            {value === 'month' ? labels.periodMonth : labels.periodYear}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const price = period === 'month' ? plan.priceUahMonth : plan.priceUahYear
          return (
            <div key={plan.id} className="flex flex-col border border-line p-6">
              <h3 className="font-display text-2xl">{labels.planNames[plan.id]}</h3>
              <p className="mt-2 text-sm text-muted">
                {plan.storageGb} GB {labels.storage}
              </p>
              <p className="mt-6 text-3xl">
                {plan.priceUahMonth === 0
                  ? labels.freePrice
                  : `${price} ${period === 'month' ? labels.perMonth : labels.perYear}`}
              </p>
              <div className="mt-auto pt-8">
                {isCurrent ? (
                  <span className="text-xs uppercase tracking-widest text-muted">
                    {labels.currentBadge}
                  </span>
                ) : plan.priceUahMonth === 0 ? null : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void upgrade(plan.id)}
                    className="border border-fg px-6 py-2.5 text-xs uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
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
