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
import { formatHeure } from '@/lib/formatHeure'
import type { ValidationJour, CorrectionPointage, CorrectionPayload } from '@/types/validation'

type Champ = 'heureArrivee' | 'heureDepart'

interface Props {
  jour: ValidationJour
  /** Corrections de ce jour (filtrées par le parent) — la plus récente en premier. */
  corrections: CorrectionPointage[]
  isCorrecting: boolean
  onCorriger: (payload: CorrectionPayload) => void
  onPointerArrivee: (pointageId: number) => void
}

function minToHHMM(minutes: number | null): string {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60); const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}
/** Calcule l'écart en minutes entre nettes et prévues (positif = sup, négatif = manque). */
function delta(jour: ValidationJour): number | null {
  if (jour.heuresNettes === null || jour.heuresPrevues === null) return null
  return jour.heuresNettes - jour.heuresPrevues
}
/** Cherche la dernière correction pour un champ donné — sert au diff inline sur la pilule. */
function lastCorrectionFor(corrections: CorrectionPointage[], champ: Champ): CorrectionPointage | null {
  return corrections.find(c => c.champModifie === champ) ?? null
}

// Conversion locale (Europe/Paris) → ISO UTC pour stockage uniforme côté back.
// Repris de l'ancien ValidationCorrectionForm.tsx (logique fuseau inchangée).
function toIsoUtc(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}

export default function ValidationDayRow({ jour, corrections, isCorrecting, onCorriger, onPointerArrivee }: Props) {
  const [openPopover, setOpenPopover] = useState<Champ | null>(null)

  const isRepos = jour.statut === 'repos' || jour.statut === 'absent_justifie' || jour.statut === 'absent_non_justifie'
  const hasCorrection  = corrections.length > 0
  const arriveeCorr    = lastCorrectionFor(corrections, 'heureArrivee')
  const departCorr     = lastCorrectionFor(corrections, 'heureDepart')
  const ecart          = delta(jour)
  const dayDateLabel   = format(parseISO(jour.date), 'EEE d MMM', { locale: fr })

  const handleApply = (champ: Champ, newTime: string, motif: string) => {
    if (jour.pointageId === null) return
    onCorriger({
      pointageId:     jour.pointageId,
      champModifie:   champ,
      nouvelleValeur: toIsoUtc(jour.date, newTime),
      motif,
    })
    setOpenPopover(null)
  }

  const arriveeVariant = arriveeCorr ? 'modified' : jour.estRetard ? 'late' : 'ok'
  const departVariant  = departCorr  ? 'modified' : jour.heureDepartAuto ? 'auto' : 'ok'

  return (
    <div className={`validation-day-row${hasCorrection ? ' validation-day-row--has-correction' : ''}${!jour.heureArrivee && !isRepos ? ' validation-day-row--empty-arrival' : ''}${isRepos ? ' validation-day-row--rest' : ''}`}>
      {hasCorrection && <span className="validation-day-row__dot" aria-hidden />}

      <div className="validation-day-row__label">
        <span className="validation-day-row__label-small">{format(parseISO(jour.date), 'EEE', { locale: fr })}</span>
        {format(parseISO(jour.date), 'd MMM', { locale: fr })}
      </div>

      <div className="validation-day-row__times">
        {isRepos ? (
          <span className="validation-day-row__rest-label">{jour.statut === 'absent_justifie' ? `Absent (${jour.typeAbsence ?? '—'})` : jour.statut === 'absent_non_justifie' ? 'Absent non justifié' : 'Repos'}</span>
        ) : jour.heureArrivee ? (
          <ValidationTimePill
            variant={arriveeVariant} label="Arr."
            time={formatHeure(jour.heureArrivee)}
            oldTime={arriveeCorr?.ancienneValeur ? formatHeure(arriveeCorr.ancienneValeur) : undefined}
            icon={arriveeCorr ? '✏️' : jour.estRetard ? '⚠' : '✓'}
            ariaLabel={`Corriger l'arrivée du ${dayDateLabel}`}
            onClick={jour.pointageId !== null ? () => setOpenPopover('heureArrivee') : undefined}
          />
        ) : jour.pointageId !== null ? (
          <button type="button" className="validation-day-row__empty-cta" onClick={() => onPointerArrivee(jour.pointageId as number)}>
            ⚠ Pointer arrivée maintenant{jour.heureDebutPlanifiee ? ` (plan. ${jour.heureDebutPlanifiee})` : ''}
          </button>
        ) : null}

        {!isRepos && jour.pauses.map(p => (
          <ValidationTimePill key={p.id} variant="neutral" icon={p.type === 'REPAS' ? '🍽' : '☕'}
            time={`${formatHeure(p.debut)}${p.fin ? `–${formatHeure(p.fin)}` : ''}`}
            subInfo={`(${p.dureeMinutes} min)`} />
        ))}

        {!isRepos && jour.heureDepart && (
          <ValidationTimePill variant={departVariant} label="Dép."
            time={formatHeure(jour.heureDepart)}
            oldTime={departCorr?.ancienneValeur ? formatHeure(departCorr.ancienneValeur) : undefined}
            icon={departCorr ? '✏️' : jour.heureDepartAuto ? undefined : '✓'}
            ariaLabel={`Corriger le départ du ${dayDateLabel}`}
            onClick={jour.pointageId !== null ? () => setOpenPopover('heureDepart') : undefined} />
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

      {openPopover && (
        <div className="validation-day-row__popover-anchor">
          <ValidationTimePopover
            initialTime={formatHeure(openPopover === 'heureArrivee' ? jour.heureArrivee : jour.heureDepart)}
            plannedTime={openPopover === 'heureArrivee' ? jour.heureDebutPlanifiee : jour.heureFinPlanifiee}
            dayLabel={dayDateLabel}
            fieldLabel={openPopover === 'heureArrivee' ? "Heure d'arrivée" : 'Heure de départ'}
            onCancel={() => setOpenPopover(null)}
            onApply={(t, m) => handleApply(openPopover, t, m)}
            isLoading={isCorrecting}
          />
        </div>
      )}
    </div>
  )
}
