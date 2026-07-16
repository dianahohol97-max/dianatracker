import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Gallery access passwords. scrypt from node:crypto — no extra dependency,
 * safe defaults. Format: scrypt$<salt hex>$<hash hex>.
 */

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password.normalize('NFKC'), salt, 32)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1], 'hex')
  const expected = Buffer.from(parts[2], 'hex')
  const actual = scryptSync(password.normalize('NFKC'), salt, expected.length)
  return timingSafeEqual(actual, expected)
}
