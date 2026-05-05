'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { useThemeStore, type Theme } from '@/store/themeStore'

interface ThemeOption {
  value: Theme
  label: string
  icon: React.ReactNode
}

const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const MoonIcon = () => (
  <svg {...ICON_PROPS}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
)

const SunIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const SandIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M3 18h18" />
    <path d="M5 18c2-4 4-6 7-6s5 2 7 6" />
    <circle cx="17" cy="7" r="2.5" />
  </svg>
)

const OPTIONS: ReadonlyArray<ThemeOption> = [
  { value: 'dark',  label: 'Sombre', icon: <MoonIcon /> },
  { value: 'light', label: 'Clair',  icon: <SunIcon  /> },
  { value: 'sand',  label: 'Sable',  icon: <SandIcon /> },
]

export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface2 border border-border">
      {OPTIONS.map((opt) => {
        const active = opt.value === theme
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-label={`Thème ${opt.label}`}
            aria-pressed={active}
            title={opt.label}
            className={cn(
              'relative flex-1 flex items-center justify-center h-7 rounded-lg transition-colors',
              active ? 'text-accent' : 'text-muted hover:text-text'
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-switcher-active"
                className="absolute inset-0 rounded-lg bg-accent/15 border border-accent/25"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">{opt.icon}</span>
          </button>
        )
      })}
    </div>
  )
}
