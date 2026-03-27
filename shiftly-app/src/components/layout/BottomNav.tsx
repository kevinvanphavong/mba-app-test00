'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const navItems = [
  { href: '/service',  label: 'Service',  icon: '📋' },
  { href: '/services', label: 'Services', icon: '📅' },
  { href: '/postes',   label: 'Postes',   icon: '🗂️' },
  { href: '/staff',    label: 'Staff',    icon: '👥' },
  { href: '/reglages', label: 'Réglages', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-border z-50">
      <div className="flex items-center justify-around px-1 py-2 max-w-[480px] mx-auto safe-area-inset-bottom">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all',
                active ? 'opacity-100' : 'opacity-35 hover:opacity-60'
              )}
            >
              <span className="text-[20px] leading-none">{item.icon}</span>
              <span
                className={cn(
                  'text-[9px] font-semibold tracking-wide',
                  active ? 'text-accent' : 'text-muted'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
