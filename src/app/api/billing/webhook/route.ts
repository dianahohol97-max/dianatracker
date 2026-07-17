import { NextResponse, type NextRequest } from 'next/server'
import { getPayments } from '@/lib/payments'
import {
  GALLERY_PLANS,
  GRACE_PERIOD_DAYS,
  isGalleryPlanId,
  isSitePlanId,
  planStorageBytes,
} from '@/lib/plans'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Provider server-to-server callback. The payload signature is verified by
 * the provider class; anything unverifiable is dropped with 400.
 *
 * On payment: apply the plan (gallery plans bump storage limits and clear
 * any grace period; site plans set profiles.site_plan).
 * On cancellation of a gallery plan: start the 7-day grace period — limits
 * stay until it ends, then uploads behave as free (enforced lazily; files
 * are NEVER deleted). Canceled site plans drop back to the trial tier.
 */
export async function POST(request: NextRequest) {
  const payments = getPayments()
  const admin = createSupabaseAdminClient()
  if (!payments || !admin) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') params[key] = value
  })

  const event = payments.parseWebhook(params)
  if (!event) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 })
  }

  const { data: payment } = await admin
    .from('payments')
    .select('id, user_id, plan, status')
    .eq('order_id', event.orderId)
    .single()
  if (!payment) {
    return NextResponse.json({ error: 'unknown_order' }, { status: 404 })
  }

  await admin
    .from('payments')
    .update({ status: event.status, raw: event.raw })
    .eq('id', payment.id)

  if (event.status === 'paid') {
    if (isGalleryPlanId(payment.plan)) {
      const plan = GALLERY_PLANS[payment.plan]
      await admin
        .from('profiles')
        .update({
          plan: plan.id,
          storage_limit_bytes: planStorageBytes(plan),
          grace_until: null,
        })
        .eq('user_id', payment.user_id)
    } else if (isSitePlanId(payment.plan)) {
      await admin
        .from('profiles')
        .update({ site_plan: payment.plan })
        .eq('user_id', payment.user_id)
    }
  } else if (event.status === 'canceled') {
    if (isGalleryPlanId(payment.plan)) {
      const graceUntil = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 3600 * 1000)
      await admin
        .from('profiles')
        .update({ grace_until: graceUntil.toISOString() })
        .eq('user_id', payment.user_id)
    } else if (isSitePlanId(payment.plan)) {
      await admin
        .from('profiles')
        .update({ site_plan: 'site_trial' })
        .eq('user_id', payment.user_id)
    }
  }

  return NextResponse.json({ ok: true })
}
