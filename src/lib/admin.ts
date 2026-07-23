/**
 * Owner-only surfaces (the platform stats page). Access is by email allowlist:
 * set ADMIN_EMAILS (comma-separated) in the environment; it defaults to the
 * founder's address so the page works out of the box.
 */
const DEFAULT_ADMINS = 'dianahohol97@gmail.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? DEFAULT_ADMINS)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
