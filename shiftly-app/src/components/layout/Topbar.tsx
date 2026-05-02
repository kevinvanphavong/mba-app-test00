'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { capitalizeFirst, capitalizeWords } from '@/lib/strings'
import NotificationBell from '@/components/layout/NotificationBell'

interface TopbarProps {
  /** Titre principal — ex: "Dashboard – Mer. 18 mars 2026" */
  title?: string
  /** Sous-titre — ex: "Service en cours — Bowling Central" */
  subtitle?: string
  /** Si fourni, affiche le bouton "+ Signaler un incident" */
  onReportIncident?: () => void
}

/**
 * Header commun aux pages de navigation.
 * - Titre + sous-titre à gauche
 * - Pastille date + bouton incident (optionnel) + cloche à droite
 * Sans `title`, fallback sur le centre + date du jour.
 */
export default function Topbar({ title, subtitle, onReportIncident }: TopbarProps) {
  const { user } = useCurrentUser()

  const today      = new Date()
  // Pastille raccourcie : chaque mot capitalisé → "Mer. 18 Mars"
  const dayShortCap = capitalizeWords(format(today, 'EEE d MMM', { locale: fr }))
  // Fallback titre : seule la 1ʳᵉ lettre capitalisée → "Vendredi 2 mai 2026"
  const dayFullCap  = capitalizeFirst(format(today, 'EEEE d MMMM yyyy', { locale: fr }))
  const centreName  = user?.centre?.nom ?? '…'

  const heading  = title    ?? dayFullCap
  const sub      = subtitle ?? centreName

  return (
    <header className="flex items-center justify-between gap-3 bg-surface border-b border-border mb-5 px-5 py-4 lg:px-7 lg:py-5">
      {/* Bloc titre */}
      <div className="min-w-0 flex-1">
        <h1 className="font-syne font-extrabold text-[20px] lg:text-[26px] text-text leading-tight truncate">
          {heading}
        </h1>
        <p className="text-[12px] lg:text-[13px] text-muted mt-0.5 truncate">
          {sub}
        </p>
      </div>

      {/* Bloc actions */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Pastille date — masquée sur très petits écrans pour gagner de la place */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-surface2 border border-border text-[12px] font-semibold text-text">
          <span aria-hidden>📅</span>
          <span>{dayShortCap}</span>
        </div>

        {/* Bouton Signaler un incident */}
        {onReportIncident && (
          <button
            onClick={onReportIncident}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-accent text-white text-[12px] lg:text-[13px] font-syne font-bold hover:bg-accent/90 active:scale-[0.97] transition-all shadow-lg shadow-accent/20"
            title="Signaler un incident"
          >
            <span aria-hidden className="text-[14px] leading-none">+</span>
            <span className="hidden md:inline">Signaler un incident</span>
            <span className="md:hidden">Incident</span>
          </button>
        )}

        <NotificationBell />
      </div>
    </header>
  )
}
