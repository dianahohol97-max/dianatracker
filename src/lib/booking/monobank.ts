/**
 * Monobank acquiring — invoices are created with the PHOTOGRAPHER's own
 * X-Token, so money lands directly in their account. The platform only
 * relays the request server-side; the token never reaches the browser.
 *
 * Trust model for confirmation: webhook bodies are NOT trusted. The server
 * re-queries the invoice status from Monobank with the same token, and only
 * a real `success` marks the slot paid.
 */

const API = 'https://api.monobank.ua/api/merchant'

export interface MonoInvoice {
  invoiceId: string
  pageUrl: string
}

export async function monoCreateInvoice(
  token: string,
  input: {
    amountUah: number
    reference: string
    destination: string
    redirectUrl: string
    webHookUrl: string
  }
): Promise<MonoInvoice> {
  const response = await fetch(`${API}/invoice/create`, {
    method: 'POST',
    headers: { 'X-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(input.amountUah * 100), // kopecks
      ccy: 980, // UAH
      merchantPaymInfo: {
        reference: input.reference,
        destination: input.destination,
      },
      redirectUrl: input.redirectUrl,
      webHookUrl: input.webHookUrl,
      validity: 24 * 3600,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Monobank invoice create failed: ${response.status}`)
  }
  const data = (await response.json()) as { invoiceId?: string; pageUrl?: string }
  if (!data.invoiceId || !data.pageUrl) {
    throw new Error('Monobank returned no invoice')
  }
  return { invoiceId: data.invoiceId, pageUrl: data.pageUrl }
}

/** Re-queries the real status; returns true only for a confirmed payment. */
export async function monoIsPaid(token: string, invoiceId: string): Promise<boolean> {
  const response = await fetch(
    `${API}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
    { headers: { 'X-Token': token }, cache: 'no-store' }
  )
  if (!response.ok) return false
  const data = (await response.json()) as { status?: string }
  return data.status === 'success'
}
