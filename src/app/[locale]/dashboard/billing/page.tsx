import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDictionary, type Dictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import {
  GALLERY_PLANS,
  SITE_PLANS,
  type GalleryPlan,
  type GalleryPlanId,
  type SitePlanId,
} from '@/lib/plans'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BillingPlans, buildGalleryCard, buildSiteCard } from '@/components/BillingPlans'
import {
  BillingSubscriptions,
  type SubscriptionView,
} from '@/components/BillingSubscriptions'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function galleryFeatureLines(plan: GalleryPlan, dict: Dictionary): string[] {
  const f = plan.features
  const lines: string[] = [dict.billing.featureSelection]
  if (f.brandingRemoval) lines.push(dict.billing.featureNoBranding)
  if (f.photographerLogo) lines.push(dict.billing.featureLogo)
  if (f.video) lines.push(dict.billing.featureVideo)
  if (f.stats) lines.push(dict.billing.featureStats)
  if (f.tips) lines.push(dict.billing.featureTips)
  if (f.prioritySupport) lines.push(dict.billing.featureSupport)
  return lines
}

export default async function BillingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const dict = await getDictionary(locale)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single<Profile>()
  if (!profile) notFound()

  const { data: subRows } = await supabase
    .from('billing_subscriptions')
    .select('product, plan, period, next_charge_at, status')
    .eq('user_id', user.id)

  const galleryNames: Record<GalleryPlanId, string> = {
    free: dict.billing.planFree,
    basic: dict.billing.planBasic,
    plus: dict.billing.planPlus,
    pro: dict.billing.planPro,
    max: dict.billing.planMax,
    maxplus: dict.billing.planMaxPlus,
  }
  const galleryNotes: Record<GalleryPlanId, string> = {
    free: dict.billing.noteFree,
    basic: dict.billing.noteBasic,
    plus: dict.billing.notePlus,
    pro: dict.billing.notePro,
    max: dict.billing.noteMax,
    maxplus: dict.billing.noteMaxPlus,
  }
  const siteNames: Record<SitePlanId, string> = {
    site_trial: dict.billing.sitePlanTrial,
    site_basic: dict.billing.sitePlanBasic,
    site_plus: dict.billing.sitePlanPlus,
  }
  const siteNotes: Record<SitePlanId, string> = {
    site_trial: dict.billing.siteTrialNote,
    site_basic: dict.billing.siteBasicNote,
    site_plus: dict.billing.sitePlusNote,
  }

  const galleryCards = (Object.keys(GALLERY_PLANS) as GalleryPlanId[]).map((id) =>
    buildGalleryCard(
      GALLERY_PLANS[id],
      galleryNames[id],
      galleryNotes[id],
      `${GALLERY_PLANS[id].storageGb >= 1024 ? `${GALLERY_PLANS[id].storageGb / 1024} ТБ` : `${GALLERY_PLANS[id].storageGb} ГБ`} ${dict.billing.storage}`,
      galleryFeatureLines(GALLERY_PLANS[id], dict),
      profile.plan
    )
  )
  const siteCards = (Object.keys(SITE_PLANS) as SitePlanId[]).map((id) =>
    buildSiteCard(SITE_PLANS[id], siteNames[id], siteNotes[id], profile.site_plan)
  )

  const labels = {
    periodMonth: dict.billing.periodMonth,
    periodYear: dict.billing.periodYear,
    upgrade: dict.billing.upgrade,
    currentBadge: dict.billing.currentBadge,
    perMonth: dict.billing.perMonth,
    perYear: dict.billing.perYear,
    freePrice: dict.billing.freePrice,
    notConfigured: dict.billing.notConfigured,
  }

  const subscriptions: SubscriptionView[] = (subRows ?? [])
    .filter(
      (row): row is typeof row & { product: 'gallery' | 'site' } =>
        row.product === 'gallery' || row.product === 'site'
    )
    .map((row) => ({
      product: row.product,
      planName:
        row.product === 'gallery' && isGalleryKey(row.plan)
          ? galleryNames[row.plan]
          : row.product === 'site' && isSiteKey(row.plan)
            ? siteNames[row.plan]
            : row.plan,
      period: row.period,
      nextChargeAt: row.next_charge_at,
      status:
        row.status === 'canceled' || row.status === 'past_due'
          ? row.status
          : 'active',
    }))

  const currentGalleryName = isGalleryKey(profile.plan)
    ? galleryNames[profile.plan]
    : profile.plan
  const currentSiteName = isSiteKey(profile.site_plan)
    ? siteNames[profile.site_plan]
    : profile.site_plan

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href={`/${locale}/dashboard`} className="text-sm text-muted hover:text-fg">
        ← {dict.dashboard.title}
      </Link>

      <h1 className="mt-6 font-brand text-3xl">{dict.billing.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {dict.billing.currentPlan}: {currentGalleryName} · {dict.billing.currentSitePlan}:{' '}
        {currentSiteName} · {dict.dashboard.storageUsed}: {formatGb(profile.storage_used_bytes)} /{' '}
        {formatGb(profile.storage_limit_bytes)}
      </p>
      {profile.grace_until && (
        <p className="mt-2 text-sm text-accent">
          {dict.billing.graceNotice}{' '}
          {new Date(profile.grace_until).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB')}
        </p>
      )}

      <section className="mt-12">
        <h2 className="mb-6 font-brand text-xl">{dict.billing.galleryPlansTitle}</h2>
        <BillingPlans cards={galleryCards} locale={locale} labels={labels} columns={3} />
      </section>

      <section className="mt-14">
        <h2 className="mb-6 font-brand text-xl">{dict.billing.sitePlansTitle}</h2>
        <BillingPlans cards={siteCards} locale={locale} labels={labels} columns={3} />
        <p className="mt-4 text-xs text-muted">{dict.billing.bundleNote}</p>
      </section>

      <BillingSubscriptions
        subscriptions={subscriptions}
        locale={locale}
        labels={{
          title: dict.billing.autoRenewTitle,
          productGallery: dict.billing.galleryPlansTitle,
          productSite: dict.billing.sitePlansTitle,
          nextCharge: dict.billing.autoRenewNextCharge,
          activeUntil: dict.billing.autoRenewActiveUntil,
          statusPastDue: dict.billing.autoRenewPastDue,
          cancel: dict.billing.autoRenewCancel,
          canceled: dict.billing.autoRenewCanceled,
          confirm: dict.billing.autoRenewConfirm,
        }}
      />
    </main>
  )
}

function isGalleryKey(value: string): value is GalleryPlanId {
  return value in GALLERY_PLANS
}
function isSiteKey(value: string): value is SitePlanId {
  return value in SITE_PLANS
}
