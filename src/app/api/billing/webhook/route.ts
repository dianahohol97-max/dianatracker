import { NextResponse, type NextRequest } from 'next/server'
import { getPayments } from '@/lib/payments'
import { isPlanId, PLANS, planStorageBytes } from '@/lib/plans'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Provider server-to-server callback. Trust model: the payload signature is
 * verified by the provider class; anything unverifiable is dropped with 400.
 * On payment: bump the profile's plan + storage limit. On cancellation:
 * downgrade to free (a retention grace period is a later feature — for now
 * the limit drops but files are NOT deleted; uploads just stop working while
 * over quota).
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

  if (event.status === 'paid' && isPlanId(payment.plan)) {
    const plan = PLANS[payment.plan]
    await admin
      .from('profiles')
      .update({ plan: plan.id, storage_limit_bytes: planStorageBytes(plan) })
      .eq('user_id', payment.user_id)
  } else if (event.status === 'canceled') {
    await admin
      .from('profiles')
      .update({ plan: 'free', storage_limit_bytes: planStorageBytes(PLANS.free) })
      .eq('user_id', payment.user_id)
  }

  return NextResponse.json({ ok: true })
}
