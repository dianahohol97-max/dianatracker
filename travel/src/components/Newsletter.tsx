'use client';

import { useState } from 'react';

import type { Locale } from '@/i18n/config';

/**
 * Email capture (spec §5). Phase 3 ships the accessible UI with client-side
 * validation and a success state; the actual Supabase persistence + double
 * opt-in is wired in Phase 7 (POST /api/newsletter). Strings are passed in from
 * the server so nothing is hardcoded here.
 */
export function Newsletter({
  locale,
  strings,
}: {
  locale: Locale;
  strings: {
    title: string;
    subtitle: string;
    placeholder: string;
    submit: string;
    consent: string;
  };
}) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 7: POST to /api/newsletter (Supabase). For now, confirm locally.
    if (email.includes('@')) setDone(true);
  }

  return (
    <section className="rounded-2xl border border-line bg-brand-soft/40 p-6 sm:p-8" lang={locale}>
      <h2 className="text-xl font-bold text-ink">{strings.title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{strings.subtitle}</p>

      {done ? (
        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm font-medium text-brand-dark">
          ✓ {strings.title}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            {strings.placeholder}
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={strings.placeholder}
            className="w-full flex-1 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {strings.submit}
          </button>
        </form>
      )}
      <p className="mt-3 text-xs text-ink-soft">{strings.consent}</p>
    </section>
  );
}
