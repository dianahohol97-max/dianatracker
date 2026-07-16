import { createHmac } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Gallery } from './types'

/**
 * Access control for password-protected public galleries.
 * After a correct password the client gets an httpOnly cookie holding an
 * HMAC of the gallery id — no session table needed, nothing sensitive stored.
 */

function unlockSecret(): string {
  // Falls back to a dev-only value so local setup works without every env
  // var; production MUST set GALLERY_UNLOCK_SECRET (see .env.example).
  return process.env.GALLERY_UNLOCK_SECRET ?? 'insecure-dev-secret'
}

export function unlockCookieName(galleryId: string): string {
  return `g_unlock_${galleryId}`
}

export function unlockCookieValue(galleryId: string): string {
  return createHmac('sha256', unlockSecret()).update(galleryId).digest('hex')
}

/** True when the gallery has no password or the visitor holds a valid unlock cookie. */
export function isGalleryUnlocked(gallery: Pick<Gallery, 'id' | 'password_hash'>): boolean {
  if (!gallery.password_hash) return true
  const cookie = cookies().get(unlockCookieName(gallery.id))
  return cookie?.value === unlockCookieValue(gallery.id)
}
