import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getDictionary } from '@/lib/i18n'
import { isLocale } from '@/lib/i18n/config'
import { PLANS } from '@/lib/plans'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BillingPlans } from '@/components/BillingPlans'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href={`/${locale}/dashboard`} className="text-sm text-muted hover:text-fg">
        ← {dict.dashboard.title}
      </Link>

      <h1 className="mt-6 font-display text-4xl">{dict.billing.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {dict.billing.currentPlan}: {dict.billing[
          profile.plan === 'start' ? 'planStart' : profile.plan === 'pro' ? 'planPro' : 'planFree'
        ]}{' '}
        · {dict.dashboard.storageUsed}: {formatGb(profile.storage_used_bytes)} /{' '}
        {formatGb(profile.storage_limit_bytes)}
      </p>

      <div className="mt-12">
        <BillingPlans
          plans={[PLANS.free, PLANS.start, PLANS.pro]}
          currentPlan={profile.plan}
          locale={locale}
          labels={{
            periodMonth: dict.billing.periodMonth,
            periodYear: dict.billing.periodYear,
            planNames: {
              free: dict.billing.planFree,
              start: dict.billing.planStart,
              pro: dict.billing.planPro,
            },
            storage: dict.billing.storage,
            upgrade: dict.billing.upgrade,
            currentBadge: dict.billing.currentBadge,
            perMonth: dict.billing.perMonth,
            perYear: dict.billing.perYear,
            freePrice: dict.billing.freePrice,
            notConfigured: dict.billing.notConfigured,
          }}
        />
      </div>
    </main>
  )
}
