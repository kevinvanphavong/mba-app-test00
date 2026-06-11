'use client'

/**
 * MobileDrawer — Drawer latéral pour la navigation < desktop (< 900px).
 * Animé via Framer Motion (slide depuis la gauche). Ferme au backdrop click,
 * Escape, ou clic sur un item. Réutilise les sections de navigation de la
 * Sidebar desktop (cohérence visuelle : Pilotage / Opérations / etc.).
 *
 * Le drawer ne gère pas de mode collapsed (un overlay ne se réduit pas).
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useNavItems, type NavItemWithActive } from '@/hooks/useNavItems'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ty } from '@/lib/typography'
import ThemeSwitcher from '@/components/layout/ThemeSwitcher'
import { backdropVariants, easeDefault } from '@/lib/animations'

interface Props {
  open:    boolean
  onClose: () => void
}

const drawerVariants = {
  closed: { x: '-100%' },
  open:   { x: 0, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  exit:   { x: '-100%', transition: { ...easeDefault, duration: 0.22 } },
}

function DrawerLink({ item, onClick }: { item: NavItemWithActive; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
        item.active
          ? 'bg-accent/10 text-accent font-bold'
          : 'text-muted hover:bg-surface2 hover:text-text'
      )}
    >
      <span className="text-[15px]">{item.icon}</span>
      <span className={`${ty.sectionLabel} flex-1 leading-none`}>{item.label}</span>
    </Link>
  )
}

export default function MobileDrawer({ open, onClose }: Props) {
  const { user } = useCurrentUser()
  const { sections, footer } = useNavItems()

  // Verrouille le scroll body + ferme à l'Escape tant que le drawer est ouvert
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!user) return null
  const initials  = `${user.prenom.trim()[0] ?? ''}${user.nom.trim()[0] ?? ''}`.toUpperCase()
  const fullName  = `${user.prenom} ${user.nom}`
  const roleLabel = user.role === 'MANAGER' ? 'Manager' : 'Employé'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] desktop:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            variants={backdropVariants}
            initial="closed" animate="open" exit="exit"
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 w-[260px] max-w-[80vw] bg-surface border-r border-border flex flex-col px-3 py-5"
            variants={drawerVariants}
            initial="closed" animate="open" exit="exit"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between px-3 mb-6">
              <div>
                <div className="font-syne font-extrabold text-[20px] leading-none">
                  <span className="text-accent">Shiftly</span>
                  <span className="text-text">.</span>
                </div>
                <div className="text-[10px] text-muted mt-1 tracking-wide">{user.centre?.nom}</div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer le menu"
                className="w-8 h-8 rounded-[9px] flex items-center justify-center text-muted hover:text-text hover:bg-surface2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col flex-1 overflow-y-auto">
              {sections.map((section, idx) => (
                <div key={section.id} className={cn('flex flex-col', idx > 0 && 'mt-3')}>
                  <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted mb-1.5 px-3">
                    {section.label}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map(item => (
                      <DrawerLink key={item.href} item={item} onClick={onClose} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-4"><ThemeSwitcher /></div>

            {/* Footer items (Réglages) — gardés sous le theme switcher */}
            {footer.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-3">
                {footer.map(item => (
                  <DrawerLink key={item.href} item={item} onClick={onClose} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-2.5 px-3 pt-4 border-t border-border mt-4">
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
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-text truncate leading-tight">{fullName}</div>
                <div className="text-[10px] text-muted leading-tight">{roleLabel}</div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
