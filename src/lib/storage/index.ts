import { R2Provider } from './R2Provider'
import type { StorageProvider } from './StorageProvider'

let cached: StorageProvider | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

/**
 * Server-only factory. Adding a provider (Backblaze B2, Bunny, …) means one
 * new class implementing StorageProvider plus a case here.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached
  const provider = process.env.STORAGE_PROVIDER ?? 'r2'
  switch (provider) {
    case 'r2':
      cached = new R2Provider({
        accountId: requireEnv('R2_ACCOUNT_ID'),
        accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
        bucket: requireEnv('R2_BUCKET'),
      })
      return cached
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`)
  }
}

/** Canonical object key layout. Everything for a gallery shares one prefix. */
export function galleryPrefix(ownerId: string, galleryId: string): string {
  return `u/${ownerId}/g/${galleryId}/`
}

export function originalKey(ownerId: string, galleryId: string, fileName: string): string {
  const safeName = fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .slice(-80)
  return `${galleryPrefix(ownerId, galleryId)}o/${crypto.randomUUID()}-${safeName}`
}

export const VARIANT_NAMES = ['preview', 'thumb'] as const
export type VariantName = (typeof VARIANT_NAMES)[number]

export function isVariantName(value: string): value is VariantName {
  return (VARIANT_NAMES as readonly string[]).includes(value)
}

export function variantKey(ownerId: string, galleryId: string, variant: VariantName): string {
  return `${galleryPrefix(ownerId, galleryId)}v/${crypto.randomUUID()}-${variant}.jpg`
}
