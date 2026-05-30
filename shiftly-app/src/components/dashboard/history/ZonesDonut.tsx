'use client'

import { ty } from '@/lib/typography'
import type { HistoryZoneRow } from '@/types/eventlog'

interface Props {
  rows: HistoryZoneRow[]
  tauxMoyen: number  // 0-100
}

const RADIUS       = 55
const STROKE_WIDTH = 18
const CIRC         = 2 * Math.PI * RADIUS

/** Donut SVG inline — pas de dépendance externe (cf. maquette). */
export default function ZonesDonut({ rows, tauxMoyen }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className={`${ty.metaLg}`}>Pas encore de données par zone.</p>
      </div>
    )
  }

  const totalChecks = rows.reduce((s, r) => s + r.checks, 0)

  let offset = 0
  const segments = rows.map(r => {
    const portion = totalChecks > 0 ? r.checks / totalChecks : 0
    const dash    = CIRC * portion
    const segment = {
      dasharray:  `${dash} ${CIRC}`,
      dashoffset: -offset,
      couleur:    r.couleur ?? '#6b7280',
      zone:       r.zone ?? '—',
      taux:       r.taux,
    }
    offset += dash
    return segment
  })

  return (
    <div className="flex flex-col items-center gap-3.5">
      {/* SVG donut */}
      <div className="relative w-[140px] h-[140px]">
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={RADIUS} fill="none" stroke="var(--surface2)" strokeWidth={STROKE_WIDTH} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={70}
              cy={70}
              r={RADIUS}
              fill="none"
              stroke={s.couleur}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-syne font-extrabold text-[22px] leading-none">{tauxMoyen.toFixed(1)}%</div>
          <div className={`${ty.sectionLabelMd} mt-0.5`}>moyen</div>
        </div>
      </div>

      {/* Légende */}
      <ul className="w-full flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
              style={{ background: r.couleur ?? '#6b7280' }}
            />
            <span className="flex-1 font-medium truncate">{r.zone ?? '—'}</span>
            <span className="font-bold text-text">{r.taux.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
