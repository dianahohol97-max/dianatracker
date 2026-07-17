'use client'

import { useState } from 'react'
import { zip, type Zippable } from 'fflate'

/**
 * "Download everything" with zero server egress: the API returns presigned
 * original URLs, the browser fetches straight from R2 and zips locally
 * (store mode — JPEG/video doesn't recompress). Whole archive is held in
 * memory, which is fine for typical shoots; a streaming writer is the
 * follow-up for multi-GB galleries.
 */

const FETCH_CONCURRENCY = 4

interface ArchiveFile {
  name: string
  url: string
}

function buildZip(entries: Zippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(entries, { level: 0 }, (error, data) => (error ? reject(error) : resolve(data)))
  })
}

export function DownloadAllButton({
  slug,
  label,
  progressLabel,
  errorLabel,
}: {
  slug: string
  label: string
  progressLabel: string
  errorLabel: string
}) {
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)

  async function download() {
    setState('working')
    setDone(0)
    try {
      const listResponse = await fetch(`/api/galleries/${slug}/archive-urls`)
      if (!listResponse.ok) throw new Error(`archive-urls ${listResponse.status}`)
      const { files } = (await listResponse.json()) as { files: ArchiveFile[] }
      setTotal(files.length)

      const entries: Zippable = {}
      const queue = [...files]
      const workers = Array.from(
        { length: Math.min(FETCH_CONCURRENCY, queue.length) },
        async () => {
          for (let file = queue.shift(); file; file = queue.shift()) {
            const response = await fetch(file.url)
            if (!response.ok) throw new Error(`fetch ${file.name} ${response.status}`)
            entries[file.name] = new Uint8Array(await response.arrayBuffer())
            setDone((previous) => previous + 1)
          }
        }
      )
      await Promise.all(workers)

      const archive = await buildZip(entries)
      // Re-view over a plain ArrayBuffer — BlobPart rejects ArrayBufferLike.
      const bytes = new Uint8Array(archive.length)
      bytes.set(archive)
      const blob = new Blob([bytes], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${slug}.zip`
      anchor.click()
      URL.revokeObjectURL(url)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={state === 'working'}
      className="border border-fg px-6 py-2.5 text-xs uppercase tracking-widest transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
    >
      {state === 'working'
        ? `${progressLabel} ${done}/${total || '…'}`
        : state === 'error'
          ? errorLabel
          : label}
    </button>
  )
}
