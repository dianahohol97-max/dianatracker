/**
 * Subscription tiers (Pixover model: free plan → paid storage tiers).
 * Prices are launch placeholders — adjust here, everything else follows.
 * Display names live in the i18n dictionaries (billing.plan<Id>).
 */

export type PlanId = 'free' | 'start' | 'pro'
export type BillingPeriod = 'month' | 'year'

export interface Plan {
  id: PlanId
  storageGb: number
  priceUahMonth: number
  priceUahYear: number
  priceUsdMonth: number
  priceUsdYear: number
}

const GB = 1024 * 1024 * 1024

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    storageGb: 3,
    priceUahMonth: 0,
    priceUahYear: 0,
    priceUsdMonth: 0,
    priceUsdYear: 0,
  },
  start: {
    id: 'start',
    storageGb: 100,
    priceUahMonth: 249,
    priceUahYear: 2490,
    priceUsdMonth: 6,
    priceUsdYear: 60,
  },
  pro: {
    id: 'pro',
    storageGb: 500,
    priceUahMonth: 499,
    priceUahYear: 4990,
    priceUsdMonth: 12,
    priceUsdYear: 120,
  },
}

export function isPlanId(value: string): value is PlanId {
  return value in PLANS
}

export function isBillingPeriod(value: string): value is BillingPeriod {
  return value === 'month' || value === 'year'
}

export function planStorageBytes(plan: Plan): number {
  return plan.storageGb * GB
}

export function planPriceUah(plan: Plan, period: BillingPeriod): number {
  return period === 'month' ? plan.priceUahMonth : plan.priceUahYear
}
