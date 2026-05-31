'use client'

/**
 * ValidationPauseGroup — Duo de pilules pour une pause (début et fin).
 * Chaque pilule est cliquable indépendamment pour ouvrir le popover sur
 * pauseDebut ou pauseFin. Diff inline si la pause a déjà été corrigée.
 */

import ValidationTimePill from './ValidationTimePill'
import { formatHeure } from '@/lib/formatHeure'
import type { ValidationPause, CorrectionPointage } from '@/types/validation'

interface Props {
  pause: ValidationPause
  /** Toutes les corrections du jour (le composant filtre lui-même par pauseId). */
  corrections: CorrectionPointage[]
  onEditDebut: (initialTime: string) => void
  onEditFin: (initialTime: string) => void
}

export default function ValidationPauseGroup({ pause, corrections, onEditDebut, onEditFin }: Props) {
  const debutCorr = corrections.find(c => c.champModifie === 'pauseDebut' && c.pauseId === pause.id) ?? null
  const finCorr   = corrections.find(c => c.champModifie === 'pauseFin'   && c.pauseId === pause.id) ?? null

  return (
    <span className="validation-day-row__pause-group">
      <ValidationTimePill
        variant={debutCorr ? 'modified' : 'neutral'}
        icon={pause.type === 'REPAS' ? '🍽' : '☕'}
        time={formatHeure(pause.debut)}
        oldTime={debutCorr?.ancienneValeur ? formatHeure(debutCorr.ancienneValeur) : undefined}
        ariaLabel="Corriger le début de la pause"
        onClick={() => onEditDebut(formatHeure(pause.debut))}
      />
      <span className="validation-day-row__pause-sep">–</span>
      <ValidationTimePill
        variant={finCorr ? 'modified' : 'neutral'}
        time={pause.fin ? formatHeure(pause.fin) : '??'}
        oldTime={finCorr?.ancienneValeur ? formatHeure(finCorr.ancienneValeur) : undefined}
        subInfo={`(${pause.dureeMinutes} min)`}
        ariaLabel="Corriger la fin de la pause"
        onClick={pause.fin ? () => onEditFin(formatHeure(pause.fin)) : undefined}
      />
    </span>
  )
}
