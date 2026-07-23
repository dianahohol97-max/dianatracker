import type { ReactNode } from 'react';

/**
 * Root layout is intentionally a pass-through: the real `<html>` / `<body>`
 * live in `app/[locale]/layout.tsx` so the `lang` and `dir` attributes can be
 * set from the resolved locale. This is the documented Next.js App Router
 * pattern for prefix-based i18n.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
