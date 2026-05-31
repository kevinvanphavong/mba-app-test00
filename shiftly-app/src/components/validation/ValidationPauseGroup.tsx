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

/**
 * Calcule la durée d'une pause en minutes à partir des heures ISO renvoyées
 * par le back. On recalcule côté front pour rester cohérent avec ce qui est
 * affiché dans les pilules même si le refetch de la query est légèrement
 * désynchronisé après une correction (sinon (20 min) reste figé alors que
 * les heures ont visiblement changé).
 */
function dureeMinutesFront(debut: string, fin: string | null): number | null {
  if (!fin) return null
  const d = new Date(debut).getTime()
  const f = new Date(fin).getTime()
  if (Number.isNaN(d) || Number.isNaN(f)) return null
  return Math.max(0, Math.round((f - d) / 60000))
}

export default function ValidationPauseGroup({ pause, corrections, onEditDebut, onEditFin }: Props) {
  const debutCorr = corrections.find(c => c.champModifie === 'pauseDebut' && c.pauseId === pause.id) ?? null
  const finCorr   = corrections.find(c => c.champModifie === 'pauseFin'   && c.pauseId === pause.id) ?? null
  const duree     = dureeMinutesFront(pause.debut, pause.fin)

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
        subInfo={duree !== null ? `(${duree} min)` : undefined}
        ariaLabel="Corriger la fin de la pause"
        onClick={pause.fin ? () => onEditFin(formatHeure(pause.fin)) : undefined}
      />
    </span>
  )
}
