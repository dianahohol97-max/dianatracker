/**
 * Payment abstraction for the Ukrainian market. LiqPay (subscriptions) and
 * Monobank acquiring (one-off invoices) ship as providers; Fondy/WayForPay
 * later mean one new class implementing this interface plus a case in the
 * factory — application code never touches provider specifics.
 */

import type { BillingPeriod } from '@/lib/plans'

export interface CheckoutRequest {
  /** Our payments.order_id — the provider echoes it back in the webhook. */
  orderId: string
  amount: number
  currency: 'UAH'
  description: string
  period: BillingPeriod
  /** Where the provider redirects the customer after payment. */
  resultUrl: string
  /** Server-to-server webhook endpoint. */
  serverUrl: string
  language: 'uk' | 'en'
}

/**
 * How the browser reaches the provider's checkout page: a POST form it
 * auto-submits (LiqPay), or — when `fields` is empty — a plain redirect
 * to `url` (Monobank).
 */
export interface CheckoutForm {
  url: string
  fields: Record<string, string>
}

export type PaymentStatus = 'paid' | 'failed' | 'canceled' | 'pending' | 'other'

export interface WebhookEvent {
  orderId: string
  status: PaymentStatus
  raw: Record<string, unknown>
}

export interface PaymentProvider {
  readonly name: string
  /**
   * False for providers that only issue one-off invoices: there is no
   * auto-renewal, so a paid period must translate into an expiry date.
   */
  readonly recurring: boolean
  createCheckoutForm(request: CheckoutRequest): Promise<CheckoutForm>
  /**
   * Receives the raw webhook body and lower-cased request headers.
   * Returns null when the signature does not verify — treat as hostile.
   */
  parseWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<WebhookEvent | null>
}
