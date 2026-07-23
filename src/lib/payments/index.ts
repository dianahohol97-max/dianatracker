import { LiqPayProvider } from './LiqPayProvider'
import { MonobankProvider } from './MonobankProvider'
import type { PaymentProvider } from './PaymentProvider'

export { canChargeTokens } from './PaymentProvider'
export type { RecurringChargeProvider, TokenChargeRequest } from './PaymentProvider'

let cached: PaymentProvider | null = null

/**
 * Server-only factory, mirroring lib/storage. Returns null when the provider
 * keys are not configured yet — routes answer 503 so the UI can explain that
 * billing is not enabled instead of crashing.
 */
export function getPayments(): PaymentProvider | null {
  if (cached) return cached
  // Explicit PAYMENT_PROVIDER wins; otherwise auto-detect from whichever keys
  // are present (so configuring MONOBANK_TOKEN alone is enough — no separate
  // PAYMENT_PROVIDER var required).
  const hasMono = !!process.env.MONOBANK_TOKEN
  const provider = process.env.PAYMENT_PROVIDER ?? (hasMono ? 'monobank' : 'liqpay')
  switch (provider) {
    case 'liqpay': {
      const publicKey = process.env.LIQPAY_PUBLIC_KEY
      const privateKey = process.env.LIQPAY_PRIVATE_KEY
      if (!publicKey || !privateKey) return null
      cached = new LiqPayProvider(publicKey, privateKey)
      return cached
    }
    case 'monobank': {
      const token = process.env.MONOBANK_TOKEN
      if (!token) return null
      cached = new MonobankProvider(token)
      return cached
    }
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`)
  }
}

/**
 * Which env vars the SELECTED provider is still missing — so a 503 during setup
 * names the real keys (e.g. LIQPAY_PUBLIC_KEY) instead of a generic hint.
 * Returns [] when the provider is fully configured.
 */
export function missingPaymentEnv(): string[] {
  const hasMono = !!process.env.MONOBANK_TOKEN
  const provider = process.env.PAYMENT_PROVIDER ?? (hasMono ? 'monobank' : 'liqpay')
  if (provider === 'monobank') {
    return process.env.MONOBANK_TOKEN ? [] : ['MONOBANK_TOKEN']
  }
  if (provider === 'liqpay') {
    return [
      !process.env.LIQPAY_PUBLIC_KEY ? 'LIQPAY_PUBLIC_KEY' : null,
      !process.env.LIQPAY_PRIVATE_KEY ? 'LIQPAY_PRIVATE_KEY' : null,
    ].filter((v): v is string => v !== null)
  }
  return [`PAYMENT_PROVIDER (unknown value: ${provider})`]
}
