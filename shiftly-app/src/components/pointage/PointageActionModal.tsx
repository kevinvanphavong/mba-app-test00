'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { backdropVariants, sheetVariants } from '@/lib/animations'
import type { PointageEntry, PauseType } from '@/types/pointage'

type ActionType = 'arrivee' | 'depart' | 'pause_start' | 'pause_end' | 'absence'

interface Props {
  pointage:   PointageEntry
  action:     ActionType
  onConfirm:  (opts: { pauseType?: PauseType; commentaire?: string }) => void
  onCancel:   () => void
  isLoading?: boolean
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDuree(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m} min`
}

const CONFIG: Record<ActionType, { icon: string; color: string; label: string; autoDismiss: boolean }> = {
  arrivee:     { icon: '👋', color: 'green',  label: 'Arrivée',      autoDismiss: true  },
  depart:      { icon: '🚪', color: 'blue',   label: 'Départ',       autoDismiss: true  },
  pause_start: { icon: '☕', color: 'yellow', label: 'Pause',        autoDismiss: false },
  pause_end:   { icon: '▶️', color: 'green',  label: 'Reprise',      autoDismiss: true  },
  absence:     { icon: '🚫', color: 'red',    label: 'Absence',      autoDismiss: false },
}

export default function PointageActionModal({ pointage, action, onConfirm, onCancel, isLoading }: Props) {
  const [pauseType,    setPauseType]    = useState<PauseType>('COURTE')
  const [commentaire,  setCommentaire]  = useState('')
  const [showComment,  setShowComment]  = useState(false)
  const cfg = CONFIG[action]
  const now = new Date()

  // Auto-dismiss sur les actions de confirmation rapide
  useEffect(() => {
    if (!cfg.autoDismiss) return
    const id = setTimeout(() => onConfirm({ commentaire: commentaire || undefined }), 2000)
    return () => clearTimeout(id)
  }, [cfg.autoDismiss, commentaire, onConfirm])

  const nomComplet = pointage.user.prenom
    ? `${pointage.user.prenom} ${pointage.user.nom}`
    : pointage.user.nom

  return (
    <motion.div
      variants={backdropVariants}
      initial="closed" animate="open" exit="exit"
      className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <motion.div
        variants={sheetVariants}
        initial="closed" animate="open" exit="exit"
        className="action-modal w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
          {/* Icône + titre */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`action-modal-icon ${cfg.color} flex items-center justify-center text-2xl`}>
              {cfg.icon}
            </div>
            <div>
              <p className="font-bold text-base font-syne" style={{ color: 'var(--text)' }}>
                {cfg.label} — {nomComplet}
              </p>

              {/* Message contextuel selon l'action */}
              {cfg.autoDismiss && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {action === 'arrivee' && `✓ Arrivée pointée à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                  {action === 'depart'  && `✓ Départ pointé à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — ${formatDuree(pointage.dureeEffective)}`}
                  {action === 'pause_end' && `✓ Pause terminée`}
                </p>
              )}
            </div>
          </div>

          {/* Choix type de pause */}
          {action === 'pause_start' && (
            <div className="flex gap-2">
              {(['COURTE', 'REPAS'] as PauseType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setPauseType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: pauseType === t ? 'rgba(234,179,8,0.2)' : 'var(--surface2)',
                    color:      pauseType === t ? 'var(--yellow)' : 'var(--muted)',
                    border:     `1px solid ${pauseType === t ? 'var(--yellow)' : 'var(--border)'}`,
                  }}
                >
                  {t === 'COURTE' ? '☕ Courte' : '🍽 Repas'}
                </button>
              ))}
            </div>
          )}

          {/* Commentaire optionnel */}
          {!showComment ? (
            <button
              onClick={() => setShowComment(true)}
              className="text-xs text-center"
              style={{ color: 'var(--muted)' }}
            >
              + Ajouter un commentaire
            </button>
          ) : (
            <input
              type="text"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Commentaire (optionnel)"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              autoFocus
            />
          )}

          {/* Boutons d'action (uniquement si pas auto-dismiss) */}
          {!cfg.autoDismiss && (
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirm({ pauseType, commentaire: commentaire || undefined })}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--accent)', color: '#fff', opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? '…' : 'Confirmer'}
              </button>
            </div>
          )}

          {cfg.autoDismiss && (
            <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
              Fermeture automatique…
            </p>
          )}
      </motion.div>
    </motion.div>
  )
}
