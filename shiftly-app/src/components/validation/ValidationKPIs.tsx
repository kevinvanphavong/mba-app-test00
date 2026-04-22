'use client'

/**
 * ValidationKPIs — 5 cartes de KPIs pour la semaine.
 * Couleurs dynamiques selon les seuils.
 */

import { motion } from 'framer-motion'
import { fadeUpVariants as fadeUp } from '@/lib/animations'
import type { ValidationKPI } from '@/types/validation'

interface Props {
  kpis: ValidationKPI
}

function minToHHMM(minutes: number): string {
  const abs  = Math.abs(minutes)
  const h    = Math.floor(abs / 60)
  const min  = abs % 60
  const sign = minutes < 0 ? '-' : ''
  return `${sign}${h}h${min > 0 ? String(min).padStart(2, '0') : ''}`
}

export default function ValidationKPIs({ kpis }: Props) {
  const ecartPositif = kpis.ecart >= 0
  const taux         = kpis.tauxPonctualite
  const tauxClass    = taux >= 90 ? 'green' : taux >= 70 ? 'orange' : 'red'
  const tauxColor    = taux >= 90 ? 'var(--green)' : taux >= 70 ? 'var(--accent)' : 'var(--red)'

  const evolutionLabel = kpis.evolutionAbsences === 0
    ? 'Stable vs sem. préc.'
    : kpis.evolutionAbsences > 0
      ? `+${kpis.evolutionAbsences} vs sem. préc.`
      : `${kpis.evolutionAbsences} vs sem. préc.`

  const kpiItems = [
    {
      icon: '🕐',
      iconClass: 'blue',
      value: minToHHMM(kpis.heuresTravaillees),
      valueColor: 'var(--blue)',
      label: 'Heures travaillées',
      trend: kpis.ecart !== 0
        ? { label: `${ecartPositif ? '+' : ''}${minToHHMM(kpis.ecart)} vs prévu`, cls: ecartPositif ? 'up' : 'down' }
        : { label: 'Conforme au planning', cls: 'up' },
    },
    {
      icon: '📅',
      iconClass: '',
      value: minToHHMM(kpis.heuresPrevues),
      valueColor: 'var(--text)',
      label: 'Heures prévues',
      trend: { label: 'Planning', cls: '' },
    },
    {
      icon: ecartPositif ? '➕' : '➖',
      iconClass: 'orange',
      value: `${ecartPositif ? '+' : ''}${minToHHMM(kpis.ecart)}`,
      valueColor: ecartPositif ? 'var(--accent)' : 'var(--red)',
      label: 'Écart prévu/réel',
      trend: { label: kpis.ecart !== 0 ? `dont ${minToHHMM(Math.max(0, kpis.ecart))} sup` : 'Équilibré', cls: 'accent' },
    },
    {
      icon: '⏰',
      iconClass: tauxClass,
      value: `${taux}%`,
      valueColor: tauxColor,
      label: 'Taux de ponctualité',
      trend: { label: taux >= 90 ? '≥ 90% — excellent' : taux >= 70 ? '70-89% — acceptable' : '< 70% — attention', cls: tauxClass === 'green' ? 'up' : 'down' },
    },
    {
      icon: kpis.nbAbsences === 0 ? '✅' : '🔴',
      iconClass: kpis.nbAbsences === 0 ? 'green' : 'red',
      value: String(kpis.nbAbsences),
      valueColor: kpis.nbAbsences === 0 ? 'var(--green)' : 'var(--red)',
      label: 'Absences',
      trend: { label: evolutionLabel, cls: kpis.evolutionAbsences < 0 ? 'up' : kpis.evolutionAbsences > 0 ? 'down' : '' },
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {kpiItems.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          className="validation-kpi-card kpi-card flex items-center gap-3 p-4"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: i * 0.05 }}
        >
          <div className={`kpi-icon flex items-center justify-center flex-shrink-0 text-xl ${kpi.iconClass}`}>
            {kpi.icon}
          </div>
          <div className="min-w-0">
            <div className="kpi-value" style={{ color: kpi.valueColor }}>
              {kpi.value}
            </div>
            <div className="kpi-label">{kpi.label}</div>
            {kpi.trend.label && (
              <div className={`validation-kpi-trend text-[11px] font-semibold mt-1 ${kpi.trend.cls}`}>
                {kpi.trend.label}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
