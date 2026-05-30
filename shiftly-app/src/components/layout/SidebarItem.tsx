'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { ty } from '@/lib/typography'
import type { NavItemWithActive } from '@/hooks/useNavItems'

interface Props {
  item:      NavItemWithActive
  collapsed: boolean
  onClick?:  () => void
}

/**
 * SidebarItem — entrée de nav cliquable.
 * En mode collapsed : label masqué, tooltip Framer Motion ancré à droite au hover.
 */
export default function SidebarItem({ item, collapsed, onClick }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={item.href}
        onClick={onClick}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? undefined : item.label}
        className={cn(
          'flex items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all overflow-hidden',
          'py-2.5',
          collapsed ? 'justify-center px-0 w-10 mx-auto' : 'px-3',
          item.active
            ? 'bg-accent/10 text-accent font-bold'
            : 'text-muted hover:bg-surface2 hover:text-text'
        )}
      >
        <span className="text-[15px] flex-shrink-0 leading-none">{item.icon}</span>
        {!collapsed && (
          <span className={`${ty.sectionLabel} flex-1 leading-none truncate`}>
            {item.label}
          </span>
        )}
      </Link>

      {/* Tooltip droit visible uniquement en mode collapsed au hover */}
      <AnimatePresence>
        {collapsed && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-text shadow-md"
            role="tooltip"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
