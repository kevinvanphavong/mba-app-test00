'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useNavItems } from '@/hooks/useNavItems'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import SidebarSection from '@/components/layout/SidebarSection'
import SidebarItem from '@/components/layout/SidebarItem'
import SidebarToggle from '@/components/layout/SidebarToggle'
import ThemeSwitcherPopover from '@/components/layout/ThemeSwitcherPopover'

const WIDTH_EXPANDED  = 240
const WIDTH_COLLAPSED = 64

function getInitials(prenom: string, nom: string): string {
  const p = prenom.trim()[0] ?? ''
  const n = nom.trim()[0] ?? ''
  return (p + n).toUpperCase()
}

function formatRole(role: string): string {
  return role === 'MANAGER' ? 'Manager' : 'Employé'
}

export default function Sidebar() {
  const { user } = useCurrentUser()
  const { sections, footer } = useNavItems()
  const { collapsed, toggle } = useSidebarCollapsed()
  const [userHovered, setUserHovered] = useState(false)

  if (!user) return null

  const initials  = getInitials(user.prenom, user.nom)
  const fullName  = `${user.prenom} ${user.nom}`
  const roleLabel = formatRole(user.role)
  const width     = collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED

  return (
    <motion.aside
      initial={false}
      animate={{ width }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      style={{ width }}
      className={cn(
        'hidden desktop:flex flex-col bg-surface border-r border-border py-6 overflow-hidden',
        collapsed ? 'px-2' : 'px-3'
      )}
    >
      {/* Logo */}
      <div className={cn('mb-7', collapsed ? 'px-0 text-center' : 'px-3')}>
        {collapsed ? (
          <div className="font-syne font-extrabold text-[20px] leading-none">
            <span className="text-accent">S</span>
            <span className="text-text">.</span>
          </div>
        ) : (
          <>
            <div className="font-syne font-extrabold text-[20px] leading-none">
              <span className="text-accent">Shiftly</span>
              <span className="text-text">.</span>
            </div>
            <div className="text-[10px] text-muted mt-1 tracking-wide truncate">{user.centre?.nom}</div>
          </>
        )}
      </div>

      {/* Sections de navigation */}
      <nav className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-2.5">
        {sections.map((section, idx) => (
          <SidebarSection
            key={section.id}
            section={section}
            collapsed={collapsed}
            showDivider={idx > 0}
          />
        ))}
      </nav>

      {/* Footer : theme + réglages + user row + toggle */}
      <div className={cn('flex flex-col gap-2 pt-4 mt-4 border-t border-border', collapsed && 'items-stretch')}>
        <ThemeSwitcherPopover collapsed={collapsed} />

        {footer.map(item => (
          <SidebarItem key={item.href} item={item} collapsed={collapsed} />
        ))}

        {/* User row : avatar + identité, avec tooltip en collapsed */}
        <div
          className={cn(
            'relative flex items-center pt-3 mt-1 border-t border-border',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
          )}
          onMouseEnter={() => setUserHovered(true)}
          onMouseLeave={() => setUserHovered(false)}
        >
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white font-extrabold text-[11px] flex-shrink-0"
            style={{
              background: user.avatarColor
                ? `linear-gradient(135deg, ${user.avatarColor}, ${user.avatarColor}cc)`
                : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))',
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-text truncate leading-tight">{fullName}</div>
              <div className="text-[10px] text-muted leading-tight">{roleLabel}</div>
            </div>
          )}
          <AnimatePresence>
            {collapsed && userHovered && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-text shadow-md"
                role="tooltip"
              >
                {fullName} — {roleLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle largeur en tout dernier */}
        <div className="pt-2">
          <SidebarToggle collapsed={collapsed} onToggle={toggle} />
        </div>
      </div>
    </motion.aside>
  )
}
