/**
 * Storage abstraction. All media (photos/videos) lives behind this interface —
 * never in Supabase. The concrete provider is chosen by env (STORAGE_PROVIDER)
 * in `./index.ts`, so swapping R2 for Backblaze B2 / Bunny is one new class,
 * zero changes to application logic.
 *
 * Cost rule this interface encodes: originals are ALWAYS transferred directly
 * between the browser and the storage provider via presigned URLs. Our
 * servers (Vercel) never proxy media bytes.
 */

export interface StorageObject {
  key: string
  sizeBytes: number
  lastModified: Date | null
}

export interface UploadUrlOptions {
  key: string
  contentType: string
  /** Presigned URL lifetime; keep short. Default is provider-defined (~10 min). */
  expiresInSeconds?: number
}

export interface SignedReadUrlOptions {
  /** Presigned URL lifetime; keep short. Default is provider-defined (~1 h). */
  expiresInSeconds?: number
  /**
   * When set, the URL forces a download with this filename
   * (Content-Disposition: attachment).
   */
  downloadFileName?: string
}

export interface StorageProvider {
  /** Presigned PUT URL for direct browser → storage upload. */
  getUploadUrl(options: UploadUrlOptions): Promise<{ url: string; key: string }>

  /** Presigned GET URL for direct browser ← storage read. */
  getSignedReadUrl(key: string, options?: SignedReadUrlOptions): Promise<string>

  /** Delete objects by key. Missing keys are ignored. */
  delete(keys: string[]): Promise<void>

  /** List objects under a prefix (used for gallery cleanup / reconciliation). */
  list(prefix: string): Promise<StorageObject[]>
}
