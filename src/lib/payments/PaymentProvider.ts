/**
 * Payment abstraction for the Ukrainian market. LiqPay is the MVP provider;
 * Fondy/WayForPay/Monobank later mean one new class implementing this
 * interface plus a case in the factory — application code never touches
 * provider specifics.
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

/** A POST form the browser auto-submits to the provider's checkout page. */
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
  createCheckoutForm(request: CheckoutRequest): CheckoutForm
  /** Returns null when the signature does not verify — treat as hostile. */
  parseWebhook(params: Record<string, string>): WebhookEvent | null
}
