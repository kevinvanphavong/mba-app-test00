'use client'

import { ty } from '@/lib/typography'
import { cn } from '@/lib/cn'

interface ServicesHeroProps {
  centreName:    string
  nbEnCours:     number
  nbAVenir:      number
  nbHistorique:  number
  /** Taux de clôture (0–100) ou null si dénominateur 0 → affiche "—" */
  tauxCloture:   number | null
  onCreate:      () => void
}

/** Couleur du KPI Tx clôture selon le seuil */
function clotureColor(taux: number | null): string {
  if (taux === null) return 'text-muted'
  if (taux >= 90)    return 'text-green'
  if (taux >= 70)    return 'text-yellow'
  return 'text-red'
}

/**
 * Hero card de la page /services (vue desktop) :
 * - Label "SERVICES" + titre "Services {centre}" + LIVE badge si EN_COURS
 * - Sous-titre compteurs (en cours / à venir / clôturés)
 * - KPI Tx clôture (couleur conditionnelle)
 * - Bouton "+ Nouveau service"
 */
export default function ServicesHero({
  centreName, nbEnCours, nbAVenir, nbHistorique, tauxCloture, onCreate,
}: ServicesHeroProps) {
  const tauxLabel = tauxCloture === null ? '—' : `${tauxCloture}%`

  return (
    <div className="relative overflow-hidden bg-surface border border-border rounded-[18px] p-5 accent-bar grid grid-cols-[1fr_auto] gap-6 items-center">
      {/* Bloc gauche */}
      <div className="min-w-0">
        <p className={`${ty.sectionLabel} mb-1.5`}>Services</p>
        <h2 className="font-syne font-extrabold text-[22px] text-text leading-tight truncate mb-1">
          {centreName}
        </h2>
        <p className={ty.metaLg}>
          Vue manager · {nbEnCours} service{nbEnCours > 1 ? 's' : ''} en cours · {nbAVenir} à venir · {nbHistorique} dans l&apos;historique
        </p>
      </div>

      {/* Bloc droite : KPI + bouton */}
      <div className="flex items-stretch gap-2.5">
        <div className="flex flex-col items-center justify-center px-3.5 py-2.5 bg-surface2 border border-border rounded-[10px] min-w-[88px] text-center">
          <span className="text-[9px] font-syne font-bold uppercase tracking-wide text-muted mb-0.5">Tx clôture</span>
          <span className={cn('font-syne font-extrabold text-[18px] leading-none', clotureColor(tauxCloture))}>
            {tauxLabel}
          </span>
        </div>
        <button
          onClick={onCreate}
          className="self-stretch px-3.5 rounded-[10px] bg-accent text-white font-syne font-bold text-[11px] hover:bg-accent/90 active:scale-[0.97] transition-all whitespace-nowrap"
        >
          + Nouveau service
        </button>
      </div>
    </div>
  )
}
