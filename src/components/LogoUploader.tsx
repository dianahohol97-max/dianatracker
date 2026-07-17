'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveLogoKey } from '@/lib/actions/profile'
import type { Locale } from '@/lib/i18n/config'

export function LogoUploader({
  locale,
  buttonLabel,
  errorLabel,
}: {
  locale: Locale
  buttonLabel: string
  errorLabel: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')

  async function upload(file: File) {
    setState('working')
    try {
      const presignResponse = await fetch('/api/profile/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      })
      if (!presignResponse.ok) throw new Error(`presign ${presignResponse.status}`)
      const { uploadUrl, key } = (await presignResponse.json()) as {
        uploadUrl: string
        key: string
      }

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!put.ok) throw new Error(`put ${put.status}`)

      await saveLogoKey(locale, key)
      setState('idle')
      router.refresh()
    } catch {
      setState('error')
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={state === 'working'}
        onClick={() => inputRef.current?.click()}
        className="border border-line px-6 py-2.5 text-xs uppercase tracking-widest text-muted transition-colors hover:border-fg hover:text-fg disabled:opacity-60"
      >
        {buttonLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void upload(file)
        }}
      />
      {state === 'error' && <p className="mt-2 text-sm text-accent">{errorLabel}</p>}
    </div>
  )
}
