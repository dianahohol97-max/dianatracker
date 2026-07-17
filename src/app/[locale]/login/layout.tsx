import type { Metadata } from 'next'

/** The login page is a client component; noindex lives in this thin layout. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
