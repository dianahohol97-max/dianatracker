import { NextResponse, type NextRequest } from 'next/server'
import { canChargeTokens, getPayments } from '@/lib/payments'
import { GRACE_PERIOD_DAYS } from '@/lib/plans'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Turns auto-renewal off. The paid period keeps running: gallery limits stay
 * until next_charge_at + grace, sites until the cron sweep at next_charge_at.
 * The saved card token is removed from the provider right away — canceling
 * must guarantee no further charges even if the cron never runs.
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
  const product =
    typeof body === 'object' && body !== null && 'product' in body
      ? (body as { product: unknown }).product
      : null
  if (product !== 'gallery' && product !== 'site') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'billing_not_configured' }, { status: 503 })
  }

  const { data: sub } = await admin
    .from('billing_subscriptions')
    .select('id, card_token, next_charge_at, status')
    .eq('user_id', user.id)
    .eq('product', product)
    .maybeSingle()
  if (!sub) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 404 })
  }

  await admin
    .from('billing_subscriptions')
    .update({ status: 'canceled' })
    .eq('id', sub.id)

  if (product === 'gallery') {
    const until = new Date(sub.next_charge_at)
    until.setDate(until.getDate() + GRACE_PERIOD_DAYS)
    await admin
      .from('profiles')
      .update({ grace_until: until.toISOString() })
      .eq('user_id', user.id)
  }

  const payments = getPayments()
  if (payments && canChargeTokens(payments)) {
    await payments.deleteToken(sub.card_token).catch(() => undefined)
  }

  return NextResponse.json({ ok: true })
}
