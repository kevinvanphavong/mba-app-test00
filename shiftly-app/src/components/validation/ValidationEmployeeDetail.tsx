'use client'

/**
 * ValidationEmployeeDetail — Panneau détail jour par jour d'un employé.
 * Affiche arrivée, pauses, départ, heures nettes et historique corrections.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants as fadeUp } from '@/lib/animations'
import ValidationCorrectionForm from './ValidationCorrectionForm'
import type { ValidationEmploye, CorrectionPayload } from '@/types/validation'

interface Props {
  employe: ValidationEmploye
  onValider: (userId: number) => void
  onCorriger: (payload: CorrectionPayload) => void
  isValidating?: boolean
  isCorrecting?: boolean
}

function minToHHMM(minutes: number | null): string {
  if (minutes === null) return '—'
  const h   = Math.floor(minutes / 60)
  const min = minutes % 60
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

export default function ValidationEmployeeDetail({
  employe,
  onValider,
  onCorriger,
  isValidating = false,
  isCorrecting = false,
}: Props) {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false)
  const [correctionPointageId, setCorrectionPointageId] = useState<number | null>(null)
  const [correctionDate, setCorrectionDate] = useState('')

  const joursActifs = employe.jours.filter(
    j => j.statut === 'travaille' || j.statut === 'en_cours'
  )

  // Seuls les jours avec un pointage existant peuvent être corrigés
  const joursCorrigeables = joursActifs.filter(j => j.pointageId !== null)
  const peutCorriger = joursCorrigeables.length > 0

  const handleCorriger = (payload: CorrectionPayload) => {
    onCorriger(payload)
    setShowCorrectionForm(false)
  }

  return (
    <motion.div
      className="flex flex-col h-full"
      variants={fadeUp}
      initial="hidden"
      animate="show"
    >
      {/* En-tête employé */}
      <div className="pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {employe.prenom} {employe.nom}
        </div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
          {employe.role === 'MANAGER' ? 'Manager' : 'Employé'}{employe.zone ? ` · ${employe.zone}` : ''}
        </div>
      </div>

      {/* Jours travaillés */}
      <div className="flex-1 overflow-y-auto">
        {joursActifs.length === 0 ? (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>
            Aucune journée travaillée cette semaine
          </div>
        ) : (
          joursActifs.map((jour) => (
            <div key={jour.date} className="validation-detail-row flex items-start gap-3 py-3">
              <div className="validation-detail-day">{jour.jourSemaine} {jour.date.slice(8)}</div>

              <div className="validation-detail-times flex-1">
                {jour.heureArrivee && (
                  <div className="validation-detail-time-item flex items-center gap-1">
                    Arrivée {jour.heureArrivee}
                    {jour.estRetard
                      ? <span style={{ color: 'var(--accent)' }}>⚠</span>
                      : <span style={{ color: 'var(--green)' }}>✓</span>
                    }
                  </div>
                )}
                {jour.pauses.map((p, i) => (
                  <div key={i} className="validation-detail-time-item flex items-center gap-1">
                    Pause {p.debut}–{p.fin ?? '??'}
                    <span>({p.dureeMinutes} min)</span>
                  </div>
                ))}
                {jour.heureDepart && (
                  <div className="validation-detail-time-item flex items-center gap-1">
                    Départ{' '}
                    {jour.heureDepartAuto ? (
                      <>
                        <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                          {jour.heureDepart}
                        </span>
                        <span
                          title="Heure de fin appliquée automatiquement (pas de pointage de départ)"
                          style={{
                            padding:       '0 4px',
                            fontSize:      9,
                            fontWeight:    700,
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                            borderRadius:  4,
                            background:    'rgba(249,115,22,0.12)',
                            color:         'var(--accent)',
                          }}
                        >
                          auto
                        </span>
                      </>
                    ) : (
                      <>
                        {jour.heureDepart}
                        <span style={{ color: 'var(--green)' }}>✓</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="validation-detail-net">
                {minToHHMM(jour.heuresNettes)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historique corrections */}
      <div className="validation-correction-history mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {!employe.corrections || employe.corrections.length === 0 ? (
          <span>
            Historique corrections : <strong style={{ color: 'var(--green)' }}>Aucune correction cette semaine</strong>
          </span>
        ) : (
          <>
            <div className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Corrections ({employe.corrections.length})</div>
            {employe.corrections.slice(0, 3).map(c => (
              <div key={c.id} className="text-[11px] py-1" style={{ color: 'var(--muted)' }}>
                {c.champModifie} : {c.ancienneValeur?.slice(11, 16) ?? '—'} → {c.nouvelleValeur?.slice(11, 16) ?? '—'} par {c.corrigePar}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Formulaire de correction */}
      {showCorrectionForm && correctionPointageId && correctionDate && (
        <div className="mt-3">
          <ValidationCorrectionForm
            pointageId={correctionPointageId}
            date={correctionDate}
            onSubmit={handleCorriger}
            onCancel={() => setShowCorrectionForm(false)}
            isLoading={isCorrecting}
          />
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onValider(employe.userId)}
          disabled={isValidating || employe.statut === 'VALIDEE'}
          className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1"
          style={{
            background: 'rgba(34,197,94,0.15)',
            color: 'var(--green)',
            borderColor: 'var(--green)',
            opacity: isValidating || employe.statut === 'VALIDEE' ? 0.5 : 1,
          }}
        >
          {employe.statut === 'VALIDEE' ? '✓ Déjà validé' : isValidating ? 'Validation...' : '✓ Valider'}
        </button>

        <button
          onClick={() => {
            // Ouvre le form sur le premier jour pointable (avec un Pointage existant)
            const premierJour = joursCorrigeables[0]
            if (premierJour && premierJour.pointageId !== null) {
              setCorrectionDate(premierJour.date)
              setCorrectionPointageId(premierJour.pointageId)
              setShowCorrectionForm(true)
            }
          }}
          disabled={!peutCorriger}
          className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text)',
            opacity: peutCorriger ? 1 : 0.5,
            cursor: peutCorriger ? 'pointer' : 'not-allowed',
          }}
        >
          ✏️ Corriger
        </button>
      </div>
    </motion.div>
  )
}
