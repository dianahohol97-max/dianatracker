import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  SignedReadUrlOptions,
  StorageObject,
  StorageProvider,
  UploadUrlOptions,
} from './StorageProvider'

const DEFAULT_UPLOAD_TTL_SECONDS = 10 * 60
const DEFAULT_READ_TTL_SECONDS = 60 * 60

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

/**
 * Cloudflare R2 implementation (S3-compatible API, zero egress fees).
 * The bucket needs a CORS rule allowing PUT/GET from the app origin —
 * see README "R2 setup".
 */
export class R2Provider implements StorageProvider {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: R2Config) {
    this.bucket = config.bucket
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async getUploadUrl(options: UploadUrlOptions): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      ContentType: options.contentType,
    })
    const url = await getSignedUrl(this.client, command, {
      expiresIn: options.expiresInSeconds ?? DEFAULT_UPLOAD_TTL_SECONDS,
    })
    return { url, key: options.key }
  }

  async getSignedReadUrl(key: string, options?: SignedReadUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options?.downloadFileName
        ? {
            ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
              options.downloadFileName
            )}"`,
          }
        : {}),
    })
    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresInSeconds ?? DEFAULT_READ_TTL_SECONDS,
    })
  }

  async delete(keys: string[]): Promise<void> {
    if (keys.length === 0) return
    // S3 DeleteObjects caps at 1000 keys per request.
    for (let i = 0; i < keys.length; i += 1000) {
      const chunk = keys.slice(i, i + 1000)
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: chunk.map((key) => ({ Key: key })), Quiet: true },
        })
      )
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const objects: StorageObject[] = []
    let continuationToken: string | undefined
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      )
      for (const item of response.Contents ?? []) {
        if (!item.Key) continue
        objects.push({
          key: item.Key,
          sizeBytes: item.Size ?? 0,
          lastModified: item.LastModified ?? null,
        })
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
    } while (continuationToken)
    return objects
  }
}
