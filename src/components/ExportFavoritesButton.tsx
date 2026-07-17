'use client'

import { useState } from 'react'

/**
 * Hands the photographer the client's picks as a plain filename list —
 * ready to paste into Lightroom/Capture One filter or a retouch brief.
 * Copies to clipboard and downloads a .txt in one click.
 */
export function ExportFavoritesButton({
  fileNames,
  label,
  copiedLabel,
}: {
  fileNames: string[]
  label: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function exportList() {
    const text = fileNames.join('\n')
    await navigator.clipboard.writeText(text)

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'favorites.txt'
    anchor.click()
    URL.revokeObjectURL(url)

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void exportList()}
      className="border border-line px-6 py-2 text-sm uppercase tracking-widest text-muted transition-colors hover:border-fg hover:text-fg"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
