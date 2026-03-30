'use client'

import { useState }       from 'react'
import { cn }             from '@/lib/cn'
import { useMarkAsRead }  from '@/hooks/useTutoriels'

interface ReadIndicatorProps {
  tutoId: number
  readId: number | null
}

/**
 * Bouton "marquer comme lu" — cercle muted → cercle vert.
 * Appelle directement useMarkAsRead — plus de faux délai mock.
 */
export default function ReadIndicator({ tutoId, readId }: ReadIndicatorProps) {
  // Optimistic : reflet local de l'état lu/non-lu
  const [localRead, setLocalRead] = useState(readId !== null)
  const { mutate, isPending }     = useMarkAsRead()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()  // Ne pas déclencher le toggle de la card
    if (isPending) return

    const next = !localRead
    setLocalRead(next)  // Mise à jour optimiste

    mutate(
      { tutorielId: tutoId, readId: next ? null : readId },
      { onError: () => setLocalRead(!next) }  // Rollback si échec
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={localRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        'transition-all duration-300 border',
        isPending && 'opacity-50 cursor-wait',
        localRead
          ? 'bg-green/15 border-green/30 text-green'
          : 'bg-surface2 border-border text-muted hover:border-muted hover:text-text'
      )}
    >
      {localRead ? (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  )
}
