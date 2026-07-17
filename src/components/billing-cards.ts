import type { GalleryPlan, SitePlan } from '@/lib/plans'

/**
 * Plan-card shape and builders live in a plain (non-'use client') module so
 * the server billing page can call them. Exporting these from the client
 * BillingPlans component turned them into client references — calling one on
 * the server threw "u is not a function".
 */
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
