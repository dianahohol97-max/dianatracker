import { createHmac } from 'node:crypto'

/**
 * WayForPay — invoices on the PHOTOGRAPHER's own merchantAccount + secret.
 * Signature scheme is HMAC-MD5 over semicolon-joined fields.
 * Confirmation mirrors Monobank: never trust the callback body, re-query
 * CHECK_STATUS with the merchant's secret and require Approved.
 */

const API = 'https://api.wayforpay.com/api'

function sign(secret: string, fields: (string | number)[]): string {
  return createHmac('md5', secret).update(fields.join(';')).digest('hex')
}

export async function wfpCreateInvoice(
  merchant: string,
  secret: string,
  input: {
    amountUah: number
    orderReference: string
    productName: string
    domain: string
    serviceUrl: string
  }
): Promise<{ url: string }> {
  const orderDate = Math.floor(Date.now() / 1000)
  const amount = input.amountUah.toFixed(2)
  const merchantSignature = sign(secret, [
    merchant,
    input.domain,
    input.orderReference,
    orderDate,
    amount,
    'UAH',
    input.productName,
    1,
    amount,
  ])

  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionType: 'CREATE_INVOICE',
      merchantAccount: merchant,
      merchantAuthType: 'SimpleSignature',
      merchantDomainName: input.domain,
      merchantSignature,
      apiVersion: 1,
      orderReference: input.orderReference,
      orderDate,
      amount,
      currency: 'UAH',
      productName: [input.productName],
      productCount: [1],
      productPrice: [amount],
      serviceUrl: input.serviceUrl,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`WayForPay invoice create failed: ${response.status}`)
  }
  const data = (await response.json()) as { invoiceUrl?: string; reason?: string }
  if (!data.invoiceUrl) {
    throw new Error(`WayForPay returned no invoice: ${data.reason ?? 'unknown'}`)
  }
  return { url: data.invoiceUrl }
}

export async function wfpIsPaid(
  merchant: string,
  secret: string,
  orderReference: string
): Promise<boolean> {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionType: 'CHECK_STATUS',
      merchantAccount: merchant,
      orderReference,
      merchantSignature: sign(secret, [merchant, orderReference]),
      apiVersion: 1,
    }),
    cache: 'no-store',
  })
  if (!response.ok) return false
  const data = (await response.json()) as { transactionStatus?: string }
  return data.transactionStatus === 'Approved'
}
