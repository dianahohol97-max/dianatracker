'use client'

import { useState } from 'react'

export function CopyLinkButton({
  url,
  label,
  copiedLabel,
}: {
  url: string
  label: string
  copiedLabel: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="border border-line px-6 py-2 text-sm uppercase tracking-widest text-muted transition-colors hover:border-fg hover:text-fg"
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
