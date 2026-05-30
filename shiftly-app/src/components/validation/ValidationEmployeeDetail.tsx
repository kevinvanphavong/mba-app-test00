'use client'

/**
 * ValidationEmployeeDetail — Orchestrateur du panneau détail employé (V2).
 * Compose : tête employé · bulk actions · liste ValidationDayRow · timeline corrections · footer.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants as fadeUp } from '@/lib/animations'
import ValidationDayRow              from './ValidationDayRow'
import ValidationCorrectionTimeline  from './ValidationCorrectionTimeline'
import ValidationBulkActions         from './ValidationBulkActions'
import ConfirmModal                  from '@/components/ui/ConfirmModal'
import type {
  ValidationEmploye, ValidationJour, CorrectionPayload, CorrectionPointage,
} from '@/types/validation'

interface Props {
  employe: ValidationEmploye
  onValider: (userId: number) => void
  onDevalider: (userId: number) => void
  onCorriger: (payload: CorrectionPayload) => void
  onAnnulerCorrection: (correction: CorrectionPointage) => void
  onPointerArrivee: (pointageId: number) => void
  isValidating?: boolean
  isDevalidating?: boolean
  isCorrecting?: boolean
  isAnnulant?: boolean
  isPointing?: boolean
}

function minToHHMM(minutes: number | null): string {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60); const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}
function initiales(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}
// Convertit 'YYYY-MM-DD' + 'HH:MM' → ISO UTC, fuseau navigateur local (Europe/Paris).
function toIsoUtc(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}

export default function ValidationEmployeeDetail({
  employe, onValider, onDevalider, onCorriger, onAnnulerCorrection, onPointerArrivee,
  isValidating = false, isDevalidating = false, isCorrecting = false,
  isAnnulant = false, isPointing = false,
}: Props) {
  const [showDevalidConfirm, setShowDevalidConfirm] = useState(false)
  const isValidee = employe.statut === 'VALIDEE'

  const corrections = employe.corrections ?? []

  // Map pointageId → date (utilisé par timeline + groupage des corrections par jour).
  const pointageToDate: Record<number, string> = useMemo(() => {
    const m: Record<number, string> = {}
    employe.jours.forEach(j => { if (j.pointageId !== null) m[j.pointageId] = j.date })
    return m
  }, [employe.jours])

  // Corrections groupées par pointageId pour pouvoir injecter "modified" sur la pilule.
  const correctionsByPointage: Record<number, CorrectionPointage[]> = useMemo(() => {
    const acc: Record<number, CorrectionPointage[]> = {}
    corrections.forEach(c => {
      const arr = acc[c.pointageId] ?? []
      arr.push(c); acc[c.pointageId] = arr
    })
    Object.values(acc).forEach(arr => arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
    return acc
  }, [corrections])

  const joursActifs = employe.jours.filter(
    (j: ValidationJour) => j.statut === 'travaille' || j.statut === 'en_cours' || j.statut === 'absent_non_justifie'
  )
  const joursAuto = joursActifs.filter(j => j.heureDepartAuto && j.pointageId !== null && j.heureFinPlanifiee)

  const handleApplyDepartPlanifieAll = () => {
    joursAuto.forEach(j => {
      if (j.pointageId === null || !j.heureFinPlanifiee) return
      onCorriger({
        pointageId:     j.pointageId,
        champModifie:   'heureDepart',
        nouvelleValeur: toIsoUtc(j.date, j.heureFinPlanifiee),
        motif:          'Appliquer le départ planifié (bulk)',
      })
    })
  }

  return (
    <motion.div className="flex flex-col h-full" variants={fadeUp} initial="hidden" animate="show">
      {/* En-tête employé */}
      <div className="validation-detail-head">
        <div className="validation-detail-head__id">
          <span className="validation-detail-head__avatar">{initiales(employe.prenom, employe.nom)}</span>
          <div>
            <div className="validation-detail-head__name">{employe.prenom} {employe.nom}</div>
            <div className="validation-detail-head__meta">
              {employe.role === 'MANAGER' ? 'Manager' : 'Employé'}{employe.zone ? ` · ${employe.zone}` : ''}
            </div>
          </div>
        </div>
        <div className="validation-detail-head__total">
          <div className="validation-detail-head__total-lbl">Heures nettes</div>
          <div className="validation-detail-head__total-val">{minToHHMM(employe.totalTravaille)}</div>
        </div>
      </div>

      <ValidationBulkActions
        nbJoursAuto={joursAuto.length}
        onAppliquerDepartPlanifie={handleApplyDepartPlanifieAll}
        isApplying={isCorrecting}
      />

      {/* Jours */}
      <div className="flex-1 overflow-y-auto">
        {employe.jours.length === 0 ? (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>
            Aucune journée cette semaine
          </div>
        ) : (
          employe.jours.map(jour => (
            <ValidationDayRow
              key={jour.date}
              jour={jour}
              corrections={jour.pointageId !== null ? (correctionsByPointage[jour.pointageId] ?? []) : []}
              isCorrecting={isCorrecting || isPointing}
              onCorriger={onCorriger}
              onPointerArrivee={onPointerArrivee}
            />
          ))
        )}
      </div>

      <ValidationCorrectionTimeline
        corrections={corrections}
        pointageToDate={pointageToDate}
        onAnnuler={onAnnulerCorrection}
        isAnnulant={isAnnulant}
      />

      {/* Footer : valider / dévalider */}
      <div className="validation-detail-foot">
        {isValidee ? (
          <button type="button" onClick={() => setShowDevalidConfirm(true)} disabled={isDevalidating}
            className="validation-detail-foot__btn-secondary">
            {isDevalidating ? 'Annulation…' : '↺ Annuler la validation'}
          </button>
        ) : (
          <button type="button" onClick={() => onValider(employe.userId)} disabled={isValidating}
            className="validation-detail-foot__btn-valider">
            {isValidating ? 'Validation…' : `✓ Valider la semaine de ${employe.prenom}`}
          </button>
        )}
      </div>

      <ConfirmModal
        open={showDevalidConfirm}
        title="Annuler la validation de la semaine ?"
        message={`Les heures validées de ${employe.prenom} ${employe.nom} repasseront en attente. Tu pourras revalider à tout moment.`}
        confirmLabel="Annuler la validation"
        cancelLabel="Garder validée"
        variant="danger"
        isLoading={isDevalidating}
        onCancel={() => setShowDevalidConfirm(false)}
        onConfirm={() => { onDevalider(employe.userId); setShowDevalidConfirm(false) }}
      />
    </motion.div>
  )
}
