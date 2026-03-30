'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'
import { useMobileNavItems } from '@/hooks/useNavItems'

export default function BottomNav() {
  const navItems = useMobileNavItems()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-border z-50">
      <div className="overflow-x-auto scrollbar-none safe-area-inset-bottom">
        <div className="flex items-center justify-evenly px-3 py-2 gap-1 min-w-max mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 w-[72px] shrink-0 py-1 rounded-xl transition-all',
                item.active ? 'opacity-100' : 'opacity-35 hover:opacity-60'
              )}
            >
              <span className="text-[20px] leading-none">{item.icon}</span>
              {/* <span
                className={cn(
                  'text-[9px] font-semibold tracking-wide truncate w-full text-center',
                  item.active ? 'text-accent' : 'text-muted'
                )}
              >
                {item.label}
              </span> */}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
