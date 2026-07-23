import { createHmac } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Gallery } from './types'

/**
 * Access control for password-protected public galleries.
 * After a correct password the client gets an httpOnly cookie holding an
 * HMAC of the gallery id — no session table needed, nothing sensitive stored.
 */

function unlockSecret(): string {
  const secret = process.env.GALLERY_UNLOCK_SECRET
  if (secret) return secret
  // Fail closed in production: a hardcoded fallback here would let anyone
  // forge the HMAC unlock cookie for any gallery and bypass its password.
  // Locally we allow a dev-only value so setup works without every env var.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('GALLERY_UNLOCK_SECRET is required in production')
  }
  return 'insecure-dev-secret'
}

export function unlockCookieName(galleryId: string): string {
  return `g_unlock_${galleryId}`
}

export function unlockCookieValue(galleryId: string): string {
  return createHmac('sha256', unlockSecret()).update(galleryId).digest('hex')
}

/** True when the gallery has no password or the visitor holds a valid unlock cookie. */
export function isGalleryUnlocked(gallery: Pick<Gallery, 'id' | 'has_password'>): boolean {
  if (!gallery.has_password) return true
  const cookie = cookies().get(unlockCookieName(gallery.id))
  return cookie?.value === unlockCookieValue(gallery.id)
}
