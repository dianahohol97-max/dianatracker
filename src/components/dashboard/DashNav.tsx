'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavItem {
  href: string
  label: string
  /** Match children too (e.g. /dashboard matches /dashboard/galleries/...). */
  prefix?: boolean
}

export function DashNav({ items, horizontal }: { items: NavItem[]; horizontal?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className={horizontal ? 'flex gap-1 overflow-x-auto' : 'flex flex-col gap-1'}>
      {items.map((item) => {
        const active = item.prefix
          ? pathname === item.href || pathname.startsWith(`${item.href}/galleries`)
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              active ? 'bg-fg text-bg' : 'text-muted hover:bg-bg hover:text-fg'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
