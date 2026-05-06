'use client'

import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'

interface Option {
  value: Theme
  label: string
  icon: string
}

/**
 * 3 options affichées dans le segment toggle.
 * L'icône est purement décorative (aria-hidden).
 */
const OPTIONS: Option[] = [
  { value: 'light', label: 'Clair',  icon: '☀' },
  { value: 'dark',  label: 'Sombre', icon: '☾' },
  { value: 'sand',  label: 'Sable',  icon: '⛱' },
]

/**
 * ThemeSwitcher — segment toggle 3 états (Clair / Sombre / Sable).
 *
 * Pattern V2 : bloc « Apparence » imbriqué dans la sidebar, juste avant
 * la carte utilisateur. Largeur full du conteneur parent.
 *
 * Persistance : déléguée au hook useTheme (data-theme + localStorage).
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="rounded-[11px] bg-surface2 border border-border p-2.5">
      <div className="text-[9px] font-syne font-bold uppercase tracking-widest text-muted mb-2 px-0.5">
        Apparence
      </div>

      <div
        role="radiogroup"
        aria-label="Choix du thème"
        className="flex gap-1 bg-bg border border-border rounded-lg p-0.5"
      >
        {OPTIONS.map((opt) => {
          const isActive = theme === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`Thème ${opt.label}`}
              onClick={() => setTheme(opt.value)}
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
    </div>
  )
}
