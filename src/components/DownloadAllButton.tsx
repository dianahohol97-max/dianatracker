'use client'

import { useState } from 'react'
import { Zip, ZipPassThrough } from 'fflate'

/**
 * "Download everything" with zero server egress: the API returns presigned
 * original URLs, the browser fetches straight from R2 and zips locally in
 * store mode (JPEG/video doesn't recompress).
 *
 * Two sinks behind one streaming pipeline:
 *  - Chromium: File System Access API → chunks stream straight to disk, so
 *    multi-GB galleries never sit in memory;
 *  - Firefox/Safari: chunks accumulate into a Blob (memory-bound fallback).
 */

interface ArchiveFile {
  name: string
  url: string
}

interface ZipSink {
  write(chunk: Uint8Array<ArrayBuffer>): Promise<void> | void
}

async function streamGalleryZip(
  files: ArchiveFile[],
  sink: ZipSink,
  onFileDone: () => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let writeChain: Promise<void> = Promise.resolve()
    const zip = new Zip((error, chunk, final) => {
      if (error) {
        reject(error)
        return
      }
      // Copy — fflate reuses its internal buffers between callbacks.
      const copy = new Uint8Array(chunk.length)
      copy.set(chunk)
      writeChain = writeChain.then(() => sink.write(copy))
      if (final) writeChain.then(resolve, reject)
    })

    void (async () => {
      try {
        // Entries are sequential by zip's nature; each file streams through
        // without ever being fully buffered.
        for (const file of files) {
          const entry = new ZipPassThrough(file.name)
          zip.add(entry)
          const response = await fetch(file.url)
          if (!response.ok || !response.body) {
            throw new Error(`fetch ${file.name} ${response.status}`)
          }
          const reader = response.body.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            entry.push(value)
          }
          entry.push(new Uint8Array(0), true)
          onFileDone()
        }
        zip.end()
      } catch (error) {
        reject(error instanceof Error ? error : new Error('zip stream failed'))
      }
    })()
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
    setTotal(0)
    try {
      const listResponse = await fetch(`/api/galleries/${slug}/archive-urls`)
      if (!listResponse.ok) throw new Error(`archive-urls ${listResponse.status}`)
      const { files } = (await listResponse.json()) as { files: ArchiveFile[] }
      setTotal(files.length)
      const onFileDone = () => setDone((previous) => previous + 1)

      if (window.showSaveFilePicker) {
        let handle: FileSystemFileHandle
        try {
          handle = await window.showSaveFilePicker({ suggestedName: `${slug}.zip` })
        } catch {
          setState('idle') // user closed the picker — not an error
          return
        }
        const writable = await handle.createWritable()
        try {
          await streamGalleryZip(files, { write: (chunk) => writable.write(chunk) }, onFileDone)
          await writable.close()
        } catch (error) {
          await writable.abort().catch(() => {})
          throw error
        }
      } else {
        const chunks: Uint8Array<ArrayBuffer>[] = []
        await streamGalleryZip(
          files,
          {
            write: (chunk) => {
              chunks.push(chunk)
            },
          },
          onFileDone
        )
        const blob = new Blob(chunks, { type: 'application/zip' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${slug}.zip`
        anchor.click()
        URL.revokeObjectURL(url)
      }

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
