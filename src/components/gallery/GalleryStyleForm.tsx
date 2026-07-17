'use client'

import { useState, useTransition } from 'react'

/**
 * Gallery style picker with visible feedback. The bare server-action form
 * saved silently, so it felt broken — this confirms with a "saved ✓" note
 * and a pending state.
 */
export function GalleryStyleForm({
  action,
  options,
  defaultValue,
  labels,
}: {
  action: (formData: FormData) => Promise<void>
  options: { value: string; label: string }[]
  defaultValue: string
  labels: { styleLabel: string; styleSave: string; styleSaved: string }
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setSaved(false)
        startTransition(async () => {
          await action(formData)
          setSaved(true)
        })
      }}
      className="mt-6 flex flex-wrap items-center gap-3"
    >
      <label className="text-sm text-muted" htmlFor="gallery-theme">
        {labels.styleLabel}
      </label>
      <select
        id="gallery-theme"
        name="theme"
        defaultValue={defaultValue}
        onChange={() => setSaved(false)}
        className="border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-fg"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-fg px-4 py-2 text-sm transition-colors hover:bg-fg hover:text-bg disabled:opacity-50"
      >
        {labels.styleSave}
      </button>
      {saved && <span className="text-sm text-accent">✓ {labels.styleSaved}</span>}
    </form>
  )
}
