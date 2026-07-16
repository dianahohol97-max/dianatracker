'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Direct-to-R2 uploader:
 *   1. POST /api/uploads/presign  → presigned PUT URL (quota + ownership checked)
 *   2. PUT the file straight to R2 (XHR for progress events)
 *   3. POST /api/uploads/complete → asset row registered under RLS
 *
 * Runs up to CONCURRENCY uploads in parallel. Resumable multipart uploads for
 * very large videos are a follow-up (S3 multipart via the same StorageProvider).
 */

const CONCURRENCY = 3

type FileStatus = 'queued' | 'uploading' | 'done' | 'error'

interface UploadItem {
  id: string
  file: File
  status: FileStatus
  progress: number // 0..100
}

async function readImageSize(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {}
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return {}
  }
}

function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Upload network error'))
    xhr.send(file)
  })
}

export function Uploader({ galleryId, dropHint }: { galleryId: string; dropHint: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragOver, setDragOver] = useState(false)

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      updateItem(item.id, { status: 'uploading' })
      try {
        const presignResponse = await fetch('/api/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            galleryId,
            fileName: item.file.name,
            contentType: item.file.type || 'application/octet-stream',
            sizeBytes: item.file.size,
          }),
        })
        if (!presignResponse.ok) throw new Error(`presign ${presignResponse.status}`)
        const { uploadUrl, key } = (await presignResponse.json()) as {
          uploadUrl: string
          key: string
        }

        await putWithProgress(uploadUrl, item.file, (progress) =>
          updateItem(item.id, { progress })
        )

        const dimensions = await readImageSize(item.file)
        const completeResponse = await fetch('/api/uploads/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            galleryId,
            key,
            contentType: item.file.type || 'application/octet-stream',
            sizeBytes: item.file.size,
            ...dimensions,
          }),
        })
        if (!completeResponse.ok) throw new Error(`complete ${completeResponse.status}`)

        updateItem(item.id, { status: 'done', progress: 100 })
      } catch {
        updateItem(item.id, { status: 'error' })
      }
    },
    [galleryId, updateItem]
  )

  const startUploads = useCallback(
    async (files: File[]) => {
      const newItems: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: 'queued',
        progress: 0,
      }))
      setItems((prev) => [...prev, ...newItems])

      // Simple concurrency pool.
      const queue = [...newItems]
      const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          await uploadOne(next)
        }
      })
      await Promise.all(workers)
      router.refresh()
    },
    [router, uploadOne]
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragOver(false)
      const files = Array.from(event.dataTransfer.files).filter(
        (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
      )
      if (files.length > 0) void startUploads(files)
    },
    [startUploads]
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer border border-dashed px-8 py-12 text-center text-sm leading-relaxed text-muted transition-colors ${
          dragOver ? 'border-fg bg-fg/5' : 'border-line hover:border-fg'
        }`}
      >
        {dropHint}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length > 0) void startUploads(files)
        }}
      />

      {items.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 text-sm">
              <span className="min-w-0 flex-1 truncate text-muted">{item.file.name}</span>
              <span className="w-40">
                <span className="block h-1 w-full bg-line">
                  <span
                    className={`block h-1 transition-all ${
                      item.status === 'error' ? 'bg-accent' : 'bg-fg'
                    }`}
                    style={{ width: `${item.status === 'error' ? 100 : item.progress}%` }}
                  />
                </span>
              </span>
              <span className="w-16 text-right text-xs uppercase tracking-widest text-muted">
                {item.status === 'done' ? '✓' : item.status === 'error' ? '✕' : `${item.progress}%`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
