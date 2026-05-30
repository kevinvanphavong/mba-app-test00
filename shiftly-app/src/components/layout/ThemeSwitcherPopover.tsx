'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'

interface Props {
  collapsed: boolean
}

interface Option {
  value: Theme
  label: string
  icon:  string
}

// Mêmes options que ThemeSwitcher.tsx (segment historique du drawer).
const OPTIONS: Option[] = [
  { value: 'light', label: 'Clair',  icon: '☀' },
  { value: 'dark',  label: 'Sombre', icon: '☾' },
  { value: 'sand',  label: 'Sable',  icon: '⛱' },
]

const THEME_ICON: Record<Theme, string> = {
  light: '☀',
  dark:  '☾',
  sand:  '⛱',
}

const THEME_LABEL: Record<Theme, string> = {
  light: 'Clair',
  dark:  'Sombre',
  sand:  'Sable',
}

/**
 * ThemeSwitcherPopover — bouton « Apparence » + popover ancré.
 *
 * - Expanded : bouton large avec icône + label + thème actuel à droite.
 * - Collapsed : bouton 40x40 icône uniquement, popover ancré à droite du bouton.
 * - Ferme au click extérieur (mousedown), Escape, ou choix d'un thème.
 */
export default function ThemeSwitcherPopover({ collapsed }: Props) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Click extérieur + Escape : fermeture commune
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current) return
      if (containerRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={collapsed ? 'Apparence' : undefined}
        title={collapsed ? `Apparence — ${THEME_LABEL[theme]}` : undefined}
        className={cn(
          'flex items-center rounded-xl border border-border bg-surface2 transition-colors hover:bg-surface',
          collapsed
            ? 'justify-center w-10 h-10 mx-auto'
            : 'w-full gap-2.5 px-3 py-2.5'
        )}
      >
        <span className="text-[15px] leading-none flex-shrink-0" aria-hidden>
          {THEME_ICON[theme]}
        </span>
        {!collapsed && (
          <>
            <span className="text-[12px] font-semibold text-text leading-none flex-1 text-left">
              Apparence
            </span>
            <span className="text-[11px] text-muted leading-none">{THEME_LABEL[theme]}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            role="dialog"
            aria-label="Choix du thème"
            className={cn(
              'absolute z-50 rounded-[12px] border border-border bg-surface p-2.5 shadow-lg',
              // Expanded : popover au-dessus du bouton, pleine largeur sidebar
              // Collapsed : popover ancré à droite du bouton (sort de la sidebar)
              collapsed
                ? 'left-full top-1/2 -translate-y-1/2 ml-2 w-[200px]'
                : 'left-0 bottom-full mb-2 w-full min-w-[220px]'
            )}
          >
            <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted mb-2 px-0.5">
              Apparence
            </div>
            <div
              role="radiogroup"
              aria-label="Choix du thème"
              className="flex gap-1 bg-bg border border-border rounded-lg p-0.5"
            >
              {OPTIONS.map(opt => {
                const isActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`Thème ${opt.label}`}
                    onClick={() => { setTheme(opt.value); setOpen(false) }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md',
                      'text-[10px] font-semibold transition-colors',
                      isActive
                        ? 'bg-accent text-accent-on'
                        : 'text-muted hover:text-text'
                    )}
                  >
                    <span aria-hidden className="text-[11px] leading-none">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
