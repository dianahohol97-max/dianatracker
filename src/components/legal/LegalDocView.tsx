import Link from 'next/link'
import type { LegalDoc } from '@/lib/legal/copy'

/** Plain, readable rendering of a legal document (offer / privacy policy). */
export function LegalDocView({
  doc,
  locale,
  backLabel,
  reviewNote,
}: {
  doc: LegalDoc
  locale: string
  backLabel: string
  reviewNote: string
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/${locale}`} className="text-sm text-muted hover:text-fg">
        {backLabel}
      </Link>

      <h1 className="mt-6 font-display text-3xl">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted">{doc.updated}</p>

      {/* Editor reminder — visible so an unfilled template is never mistaken
          for a finished, published document. Remove once details are filled. */}
      {reviewNote && (
        <p className="mt-6 rounded border border-line bg-line/30 px-4 py-3 text-xs text-muted">
          {reviewNote}
        </p>
      )}

      <p className="mt-6 leading-relaxed">{doc.intro}</p>

      <div className="mt-8 flex flex-col gap-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg">{section.heading}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
