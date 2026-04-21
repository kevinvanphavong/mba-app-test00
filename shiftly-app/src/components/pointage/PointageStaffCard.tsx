'use client'

import { motion } from 'framer-motion'
import { listItemVariants } from '@/lib/animations'
import type { PointageEntry } from '@/types/pointage'

interface Props {
  pointage:  PointageEntry
  now:       Date
  onAction:  (pointage: PointageEntry, action: 'arrivee' | 'depart' | 'pause_start' | 'pause_end' | 'absence') => void
}

function Avatar({ user }: { user: PointageEntry['user'] }) {
  const initiales = [user.prenom?.[0], user.nom[0]].filter(Boolean).join('').toUpperCase()
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background: user.avatarColor ?? 'var(--surface2)', color: '#fff', fontFamily: 'var(--font-syne)' }}
    >
      {initiales}
    </div>
  )
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDuree(minutes: number): string {
  if (minutes <= 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m} min`
}

function pauseEnCoursDepuis(pointage: PointageEntry, now: Date): number {
  const pauseOuverte = pointage.pauses.find(p => !p.heureFin)
  if (!pauseOuverte) return 0
  return Math.round((now.getTime() - new Date(pauseOuverte.heureDebut).getTime()) / 60000)
}

function dataStatus(pointage: PointageEntry): string {
  const { statut, minutesRetard } = pointage
  if (statut === 'PREVU' && minutesRetard > 0) return 'prevu-retard'
  return statut.toLowerCase().replace('_', '-')
}

export default function PointageStaffCard({ pointage, now, onAction }: Props) {
  const { statut, user, poste, heureArrivee, heureDepart, dureeEffective, minutesRetard, commentaire } = pointage
  const nom = user.prenom ? `${user.prenom} ${user.nom}` : user.nom

  return (
    <motion.div
      variants={listItemVariants}
      className="staff-card p-4 flex flex-col gap-3"
      data-status={dataStatus(pointage)}
    >
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm font-syne text-[var(--text)]">{nom}</p>
            {poste?.zone && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${poste.zone.couleur}22`, color: poste.zone.couleur }}
              >
                {poste.zone.nom}
              </span>
            )}
          </div>
          {poste?.heureDebut && poste?.heureFin && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {poste.heureDebut} – {poste.heureFin}
            </p>
          )}
        </div>

        {/* Badge statut */}
        {statut === 'EN_COURS' && <span className="badge-statut en-cours">En service</span>}
        {statut === 'EN_PAUSE' && <span className="badge-statut en-pause">En pause</span>}
        {statut === 'TERMINE'  && <span className="badge-statut termine">✓ Terminé</span>}
        {statut === 'ABSENT'   && <span className="badge-statut absent">Absent</span>}
        {statut === 'PREVU' && minutesRetard > 0 && (
          <span className="badge-statut retard">+{minutesRetard} min</span>
        )}
      </div>

      {/* Corps selon statut */}
      {statut === 'PREVU' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {poste?.heureDebut
              ? `Attendu à ${poste.heureDebut}`
              : 'Non planifié'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onAction(pointage, 'arrivee')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}
            >
              👋 Arrivée
            </button>
            <button
              onClick={() => onAction(pointage, 'absence')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.10)', color: 'var(--red)' }}
            >
              Absent
            </button>
          </div>
        </div>
      )}

      {statut === 'EN_COURS' && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Arrivée : {heureArrivee ? formatHeure(heureArrivee) : '—'}
              {minutesRetard > 0 && (
                <span className="ml-1" style={{ color: 'var(--accent)' }}>⚠ +{minutesRetard} min</span>
              )}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--green)' }}>
              {formatDuree(dureeEffective)} effectifs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAction(pointage, 'pause_start')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(234,179,8,0.15)', color: 'var(--yellow)' }}
            >
              ☕ Pause
            </button>
            <button
              onClick={() => onAction(pointage, 'depart')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(107,114,128,0.15)', color: 'var(--muted)' }}
            >
              🚪 Départ
            </button>
          </div>
        </div>
      )}

      {statut === 'EN_PAUSE' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--yellow)' }}>
            En pause depuis {pauseEnCoursDepuis(pointage, now)} min
          </p>
          <button
            onClick={() => onAction(pointage, 'pause_end')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)' }}
          >
            ▶ Reprendre
          </button>
        </div>
      )}

      {statut === 'TERMINE' && (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {heureArrivee && heureDepart && (
            <p>{formatHeure(heureArrivee)} → {formatHeure(heureDepart)} — {formatDuree(dureeEffective)} nets</p>
          )}
          {pointage.pauses.length > 0 && (
            <p className="mt-0.5">{pointage.pauses.length} pause{pointage.pauses.length > 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {statut === 'ABSENT' && commentaire && (
        <p className="text-xs italic" style={{ color: 'var(--muted)' }}>{commentaire}</p>
      )}
    </motion.div>
  )
}
