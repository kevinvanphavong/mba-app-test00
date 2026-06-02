'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const TABS: { href: string; label: string }[] = [
  { href: '/haccp',             label: 'Registre' },
  { href: '/haccp/equipements', label: 'Équipements' },
]

/** Tabs partagés entre /haccp et /haccp/equipements. */
export default function HaccpTabsNav() {
  const pathname = usePathname()
  return (
    <nav className="inline-flex bg-surface border border-border rounded-[10px] p-1">
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-1.5 text-[13px] font-semibold rounded-[7px] transition-colors',
              active ? 'bg-accent text-white' : 'text-muted hover:text-text'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
