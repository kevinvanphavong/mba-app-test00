'use client'

/**
 * Header — Barre fixe en haut visible uniquement < desktop (< 900px).
 * Logo Shiftly + nom du centre à gauche, bouton burger à droite qui ouvre
 * un MobileDrawer (state local).
 */

import { useState } from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import MobileDrawer from '@/components/layout/MobileDrawer'

export default function Header() {
  const { user } = useCurrentUser()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <header className="desktop:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-surface/95 backdrop-blur border-b border-border">
        <div className="flex flex-col min-w-0">
          <div className="font-syne font-extrabold text-[18px] leading-none">
            <span className="text-accent">Shiftly</span>
            <span className="text-text">.</span>
          </div>
          <div className="text-[10px] text-muted mt-0.5 truncate tracking-wide">{user.centre.nom}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-text hover:bg-surface2 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
