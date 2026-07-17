/**
 * Monobank PERSONAL API — used only for auto-confirming MANUAL payments
 * (jar links / card requisites have no merchant webhook). The photographer
 * optionally shares a personal token; the server reads the statement and
 * matches incoming credits to booked slots. The principle stays intact:
 * payment is confirmed by the bank's records, never by the client's word.
 *
 * Rate limit: 1 statement request per 60 s per token — callers must guard
 * with booking_settings.last_statement_check.
 */

export interface MonoStatementEntry {
  id: string
  /** Unix seconds */
  time: number
  /** Kopecks; positive = incoming */
  amount: number
}

export async function monoStatement(
  token: string,
  account: string,
  fromUnixSeconds: number
): Promise<MonoStatementEntry[]> {
  const acc = account || '0'
  const response = await fetch(
    `https://api.monobank.ua/personal/statement/${encodeURIComponent(acc)}/${fromUnixSeconds}`,
    { headers: { 'X-Token': token }, cache: 'no-store' }
  )
  if (!response.ok) return []
  const data = (await response.json()) as unknown
  if (!Array.isArray(data)) return []
  return data
    .filter(
      (e): e is { id: string; time: number; amount: number } =>
        typeof e === 'object' && e !== null &&
        typeof (e as Record<string, unknown>).id === 'string' &&
        typeof (e as Record<string, unknown>).time === 'number' &&
        typeof (e as Record<string, unknown>).amount === 'number'
    )
    .filter((e) => e.amount > 0)
}
