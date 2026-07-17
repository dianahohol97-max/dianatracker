/**
 * Transactional email (booking notifications). Resend-compatible HTTP API,
 * chosen because it is one POST with no SDK. Without RESEND_API_KEY the
 * function is a silent no-op, so booking works before email is configured —
 * the photographer still sees the booking in the dashboard.
 */
export async function sendEmail(input: {
  to: string
  subject: string
  text: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
    })
  } catch {
    // Notification failure must never break the booking itself.
  }
}
