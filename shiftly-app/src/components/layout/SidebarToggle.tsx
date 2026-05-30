'use client'

import { cn } from '@/lib/cn'

interface Props {
  collapsed: boolean
  onToggle:  () => void
}

/**
 * SidebarToggle — bouton chevrons en bas de sidebar.
 * Reflète l'action : « Réduire » quand expanded, « Étendre » quand collapsed.
 * Raccourci Cmd/Ctrl + B documenté dans le title.
 */
export default function SidebarToggle({ collapsed, onToggle }: Props) {
  const label = collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={`${label} (⌘B)`}
      className={cn(
        'flex items-center justify-center rounded-lg border border-border text-muted hover:text-text hover:bg-surface2 transition-colors',
        collapsed ? 'w-8 h-8 mx-auto' : 'w-full h-8'
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {collapsed ? (
          // chevrons-right
          <>
            <path d="m6 17 5-5-5-5" />
            <path d="m13 17 5-5-5-5" />
          </>
        ) : (
          // chevrons-left
          <>
            <path d="m11 17-5-5 5-5" />
            <path d="m18 17-5-5 5-5" />
          </>
        )}
      </svg>
    </button>
  )
}
