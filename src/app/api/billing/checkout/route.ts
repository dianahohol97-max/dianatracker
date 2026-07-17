import { NextResponse, type NextRequest } from 'next/server'
import { getPayments } from '@/lib/payments'
import { isBillingPeriod, isPlanId, PLANS, planPriceUah } from '@/lib/plans'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface CheckoutBody {
  plan: string
  period: string
  locale?: string
}

function isCheckoutBody(value: unknown): value is CheckoutBody {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.plan === 'string' &&
    typeof v.period === 'string' &&
    (v.locale === undefined || typeof v.locale === 'string')
  )
}

/**
 * Starts an upgrade: records a pending payment row and returns the provider's
 * checkout form for the browser to auto-submit. Requires LIQPAY_* and
 * SUPABASE_SERVICE_ROLE_KEY env — answers 503 until billing is configured.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  if (!isCheckoutBody(body) || !isPlanId(body.plan) || !isBillingPeriod(body.period)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (body.plan === 'free') {
    return NextResponse.json({ error: 'free_plan_needs_no_checkout' }, { status: 400 })
  }

  const payments = getPayments()
  const admin = createSupabaseAdminClient()
  if (!payments || !admin) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  }

  const plan = PLANS[body.plan]
  const amount = planPriceUah(plan, body.period)
  const orderId = crypto.randomUUID()
  const locale = body.locale === 'en' ? 'en' : 'uk'

  const { error } = await admin.from('payments').insert({
    user_id: user.id,
    provider: payments.name,
    order_id: orderId,
    plan: plan.id,
    period: body.period,
    amount,
    currency: 'UAH',
    status: 'pending',
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  const form = payments.createCheckoutForm({
    orderId,
    amount,
    currency: 'UAH',
    description: `Gallery plan "${plan.id}" (${plan.storageGb} GB), billed per ${body.period}`,
    period: body.period,
    resultUrl: `${appUrl}/${locale}/dashboard/billing`,
    serverUrl: `${appUrl}/api/billing/webhook`,
    language: locale,
  })

  return NextResponse.json(form)
}
