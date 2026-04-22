'use client'

/**
 * ValidationTable — Tableau principal employés × 7 jours.
 * Ligne cliquable pour ouvrir le panneau détail.
 */

import { motion } from 'framer-motion'
import ValidationDayCell from './ValidationDayCell'
import type { ValidationEmploye, ValidationJour } from '@/types/validation'

interface Props {
  employes: ValidationEmploye[]
  selectedUserId: number | null
  onSelectEmploye: (userId: number) => void
  dateDebut: string
}

function minToHHMM(minutes: number): string {
  const h   = Math.floor(Math.abs(minutes) / 60)
  const min = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : ''
  return `${sign}${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

function getRowStatus(employe: ValidationEmploye): 'validated' | 'pending' | 'issue' {
  if (employe.statut === 'VALIDEE') return 'validated'
  if (employe.nbAbsences > 0)      return 'issue'
  return 'pending'
}

function getBadgeStatus(employe: ValidationEmploye): { label: string; status: 'validated' | 'pending' | 'issue' } {
  if (employe.statut === 'VALIDEE')    return { label: '✓ Validé',    status: 'validated' }
  if (employe.nbAbsences > 0)          return { label: '⚠️ Absence',   status: 'issue' }
  return { label: '⏳ À valider', status: 'pending' }
}

const JOURS_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function ValidationTable({ employes, selectedUserId, onSelectEmploye, dateDebut }: Props) {
  if (employes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--muted)' }}>
        <div className="text-3xl mb-3">📋</div>
        <div className="text-sm">Aucun employé pour cette semaine</div>
      </div>
    )
  }

  // Calculer les numéros de jours depuis dateDebut
  const lundiDate = new Date(dateDebut)
  const dayHeaders = JOURS_HEADERS.map((nom, i) => {
    const d = new Date(lundiDate)
    d.setDate(d.getDate() + i)
    return `${nom} ${d.getDate()}`
  })

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className="validation-table">
        <thead>
          <tr>
            <th style={{ minWidth: 140 }}>Employé</th>
            {dayHeaders.map(h => (
              <th key={h} style={{ minWidth: 100, textAlign: 'center' }}>{h}</th>
            ))}
            <th style={{ minWidth: 80 }}>Total<br />réel</th>
            <th style={{ minWidth: 80 }}>Total<br />prévu</th>
            <th style={{ minWidth: 70 }}>Écart</th>
            <th style={{ minWidth: 60 }}>Sup</th>
            <th style={{ minWidth: 120 }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {employes.map((employe, idx) => {
            const rowStatus  = getRowStatus(employe)
            const badge      = getBadgeStatus(employe)
            const ecartClass = employe.ecart > 0 ? 'green' : employe.ecart < 0 ? 'red' : 'green'
            const supClass   = employe.heuresSup > 0 ? 'orange' : ''
            const isSelected = selectedUserId === employe.userId

            return (
              <motion.tr
                key={employe.userId}
                className="validation-row"
                data-status={rowStatus}
                onClick={() => onSelectEmploye(employe.userId)}
                style={{
                  outline: isSelected ? '1px solid var(--accent)' : undefined,
                  background: isSelected ? 'rgba(249,115,22,0.04)' : undefined,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
              >
                <td>
                  <div className="validation-employee-name">
                    {employe.prenom} {employe.nom.charAt(0)}.
                  </div>
                  <div className="validation-employee-role">
                    {employe.zone ?? employe.role}
                  </div>
                </td>

                {employe.jours.map((jour) => (
                  <ValidationDayCell key={jour.date} jour={jour} />
                ))}

                <td>
                  <div className={`validation-total-cell ${ecartClass}`}>
                    {minToHHMM(employe.totalTravaille)}
                  </div>
                </td>
                <td>
                  <div className="validation-total-cell">
                    {minToHHMM(employe.totalPrevu)}
                  </div>
                </td>
                <td>
                  <div className={`validation-total-cell ${ecartClass}`}>
                    {employe.ecart > 0 ? '+' : ''}{minToHHMM(employe.ecart)}
                  </div>
                </td>
                <td>
                  <div className={`validation-total-cell ${supClass}`}>
                    {employe.heuresSup > 0 ? minToHHMM(employe.heuresSup) : '0h'}
                  </div>
                </td>
                <td>
                  <span
                    className="validation-status-badge-small"
                    data-status={badge.status}
                  >
                    {badge.label}
                  </span>
                  {employe.note && (
                    <div className="validation-row-note">{employe.note}</div>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
