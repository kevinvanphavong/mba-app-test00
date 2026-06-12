'use client'

/**
 * ValidationDayRow — Une ligne jour du panneau détail (arrivée, pauses, départ).
 * Pilules cliquables ouvrant ValidationTimePopover, diff inline, marqueur jour corrigé.
 */

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import ValidationTimePill from './ValidationTimePill'
import ValidationTimePopover from './ValidationTimePopover'
import ValidationPauseGroup from './ValidationPauseGroup'
import ValidationArriveeEmptyCta from './ValidationArriveeEmptyCta'
import { absenceTypeLabel } from '@/lib/absence'
import { formatHeure } from '@/lib/formatHeure'
import { minToHHMM, deltaHeures, lastCorrectionFor, toIsoUtc } from '@/lib/validationDay'
import type { ValidationJour, CorrectionPointage, CorrectionPayload, CorrectionChamp } from '@/types/validation'

interface Props {
  jour: ValidationJour
  /** Corrections de ce jour (filtrées par le parent) — la plus récente en premier. */
  corrections: CorrectionPointage[]
  isCorrecting: boolean
  onCorriger: (payload: CorrectionPayload) => void
  onPointerArrivee: (pointageId: number) => void
}

type PopoverState = { champ: CorrectionChamp; pauseId?: number; initialTime: string }

export default function ValidationDayRow({ jour, corrections, isCorrecting, onCorriger, onPointerArrivee }: Props) {
  const [popover, setPopover] = useState<PopoverState | null>(null)

  const isRepos       = jour.statut === 'repos' || jour.statut === 'absent_justifie' || jour.statut === 'absent_non_justifie'
  const hasCorrection = corrections.length > 0
  const arriveeCorr   = lastCorrectionFor(corrections, 'heureArrivee')
  const departCorr    = lastCorrectionFor(corrections, 'heureDepart')
  const ecart         = deltaHeures(jour)
  const dayDateLabel  = format(parseISO(jour.date), 'EEE d MMM', { locale: fr })

  const handleApply = (newTime: string, motif: string) => {
    if (jour.pointageId === null || popover === null) return
    onCorriger({
      pointageId:     jour.pointageId,
      champModifie:   popover.champ,
      nouvelleValeur: toIsoUtc(jour.date, newTime),
      motif,
      pauseId:        popover.pauseId,
    })
    setPopover(null)
  }

  const arriveeVariant = arriveeCorr ? 'modified' : jour.estRetard ? 'late' : 'ok'
  const departVariant  = departCorr  ? 'modified' : jour.heureDepartAuto ? 'auto' : 'ok'

  const popoverInfo = popover === null ? null : {
    plannedTime: popover.champ === 'heureArrivee' ? jour.heureDebutPlanifiee
               : popover.champ === 'heureDepart'  ? jour.heureFinPlanifiee
               : null,
    fieldLabel:  popover.champ === 'heureArrivee' ? "Heure d'arrivée"
               : popover.champ === 'heureDepart'  ? 'Heure de départ'
               : popover.champ === 'pauseDebut'   ? 'Début pause' : 'Fin pause',
  }

  const rowClass = [
    'validation-day-row',
    hasCorrection && 'validation-day-row--has-correction',
    !jour.heureArrivee && !isRepos && 'validation-day-row--empty-arrival',
    isRepos && 'validation-day-row--rest',
  ].filter(Boolean).join(' ')

  return (
    <div className={rowClass}>
      {hasCorrection && <span className="validation-day-row__dot" aria-hidden />}

      <div className="validation-day-row__label">
        <span className="validation-day-row__label-small">{format(parseISO(jour.date), 'EEE', { locale: fr })}</span>
        {format(parseISO(jour.date), 'd MMM', { locale: fr })}
      </div>

      <div className="validation-day-row__times">
        {isRepos ? (
          <span className="validation-day-row__rest-label">{jour.statut === 'absent_justifie' ? absenceTypeLabel(jour.typeAbsence) : jour.statut === 'absent_non_justifie' ? 'Absent non justifié' : 'Repos'}</span>
        ) : jour.heureArrivee ? (
          <ValidationTimePill variant={arriveeVariant} label="Arr."
            time={formatHeure(jour.heureArrivee)}
            oldTime={arriveeCorr?.ancienneValeur ? formatHeure(arriveeCorr.ancienneValeur) : undefined}
            icon={arriveeCorr ? '✏️' : jour.estRetard ? '⚠' : '✓'}
            ariaLabel={`Corriger l'arrivée du ${dayDateLabel}`}
            onClick={jour.pointageId !== null ? () => setPopover({ champ: 'heureArrivee', initialTime: formatHeure(jour.heureArrivee) }) : undefined}
          />
        ) : (
          <ValidationArriveeEmptyCta jourDate={jour.date} pointageId={jour.pointageId}
            heureDebutPlanifiee={jour.heureDebutPlanifiee}
            onPointerNow={onPointerArrivee}
            onOpenSaisie={(t) => setPopover({ champ: 'heureArrivee', initialTime: t })} />
        )}

        {!isRepos && jour.pauses.map(p => (
          <ValidationPauseGroup key={p.id} pause={p} corrections={corrections}
            onEditDebut={(t) => setPopover({ champ: 'pauseDebut', pauseId: p.id, initialTime: t })}
            onEditFin={(t)   => setPopover({ champ: 'pauseFin',   pauseId: p.id, initialTime: t })} />
        ))}

        {!isRepos && jour.heureDepart && (
          <ValidationTimePill variant={departVariant} label="Dép."
            time={formatHeure(jour.heureDepart)}
            oldTime={departCorr?.ancienneValeur ? formatHeure(departCorr.ancienneValeur) : undefined}
            icon={departCorr ? '✏️' : jour.heureDepartAuto ? undefined : '✓'}
            ariaLabel={`Corriger le départ du ${dayDateLabel}`}
            onClick={jour.pointageId !== null ? () => setPopover({ champ: 'heureDepart', initialTime: formatHeure(jour.heureDepart) }) : undefined} />
        )}
      </div>

      <div className="validation-day-row__net">
        {minToHHMM(jour.heuresNettes)}
        {ecart !== null && ecart !== 0 && (
          <span className={`validation-day-row__delta validation-day-row__delta--${ecart > 0 ? 'up' : 'down'}`}>
            {ecart > 0 ? '+' : '−'}{Math.abs(ecart)} min
          </span>
        )}
      </div>

      {popoverInfo && popover && (
        <ValidationTimePopover
          initialTime={popover.initialTime}
          plannedTime={popoverInfo.plannedTime}
          dayLabel={dayDateLabel}
          fieldLabel={popoverInfo.fieldLabel}
          onCancel={() => setPopover(null)}
          onApply={handleApply}
          isLoading={isCorrecting}
          allowApplyUnchanged={popover.champ === 'heureArrivee' && !jour.heureArrivee}
        />
      )}
    </div>
  )
}
